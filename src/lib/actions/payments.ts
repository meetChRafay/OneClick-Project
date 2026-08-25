"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";
import type { PaymentStatus } from "@/types/domain";

/**
 * Billing / invoicing (spec-adjacent module): admins record what a project
 * owes and track invoice status. This is a billing *tracker*, not a live
 * payment processor — no card numbers are collected and no money actually
 * moves. Wiring a real gateway (Stripe/PayPal) would replace the manual
 * "mark as paid" action below with a webhook-driven status update.
 */
export async function createPaymentAction(input: {
  projectId: string;
  clientId: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  currency?: string;
  dueDate: string;
  status?: PaymentStatus;
}) {
  const user = await requireAdmin();
  const repo = getRepository();

  const payment = await repo.createPayment({
    organization_id: user.organizationId,
    project_id: input.projectId,
    client_id: input.clientId,
    invoice_number: input.invoiceNumber,
    description: input.description,
    amount: input.amount,
    currency: input.currency ?? "USD",
    status: input.status ?? "draft",
    issued_date: new Date().toISOString().slice(0, 10),
    due_date: input.dueDate,
    paid_date: null,
    payment_method: null,
    notes_internal: null,
    created_by: user.id,
  });

  await repo.logActivity({
    organization_id: user.organizationId,
    project_id: input.projectId,
    entity_type: "payment",
    entity_id: payment.id,
    actor_id: user.id,
    action: `created invoice ${payment.invoice_number} for ${payment.amount} ${payment.currency}`,
  });

  if (payment.status === "sent") {
    await notifyClientOfInvoice(payment.client_id, payment.invoice_number, payment.amount, payment.currency, user);
  }

  revalidatePath("/payments");
  revalidatePath(`/projects/${input.projectId}`);
  return payment;
}

export async function updatePaymentStatusAction(paymentId: string, status: PaymentStatus) {
  const user = await requireAdmin();
  const repo = getRepository();
  const payment = await repo.getPayment(paymentId);
  if (!payment || payment.organization_id !== user.organizationId) throw new Error("Invoice not found");

  const wasSent = payment.status === "sent" || payment.status === "overdue";
  const updated = await repo.updatePayment(paymentId, {
    status,
    paid_date: status === "paid" ? new Date().toISOString().slice(0, 10) : status === "sent" ? null : payment.paid_date,
  });

  await repo.logActivity({
    organization_id: user.organizationId,
    project_id: payment.project_id,
    entity_type: "payment",
    entity_id: paymentId,
    actor_id: user.id,
    action:
      status === "paid"
        ? `marked invoice ${payment.invoice_number} as paid`
        : `changed invoice ${payment.invoice_number} status to "${status}"`,
  });

  if (status === "sent" && !wasSent) {
    await notifyClientOfInvoice(payment.client_id, payment.invoice_number, payment.amount, payment.currency, user);
  }

  if (status === "paid") {
    const teammates = (await repo.listProfiles(user.organizationId)).filter(
      (p) => p.role === "admin" && p.id !== user.id
    );
    for (const teammate of teammates) {
      await repo.createNotification({
        organization_id: user.organizationId,
        profile_id: teammate.id,
        type: "payment_received",
        title: `Invoice ${payment.invoice_number} paid`,
        body: `${payment.amount} ${payment.currency} received.`,
        link: "/payments",
        actor_id: user.id,
      });
    }
  }

  revalidatePath("/payments");
  revalidatePath(`/projects/${payment.project_id}`);
  return updated;
}

async function notifyClientOfInvoice(
  clientId: string,
  invoiceNumber: string,
  amount: number,
  currency: string,
  actor: { organizationId: string; id: string }
) {
  const repo = getRepository();
  const client = await repo.getClient(clientId);
  if (!client) return;
  await repo.createNotification({
    organization_id: actor.organizationId,
    profile_id: client.profile_id,
    type: "invoice_sent",
    title: `New invoice: ${invoiceNumber}`,
    body: `${amount} ${currency} due — view it in Payments.`,
    link: "/payments",
    actor_id: actor.id,
  });
}
