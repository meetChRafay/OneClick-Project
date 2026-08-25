import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { getAccessibleProjectIds } from "@/lib/authz";
import { generateInvoicePdf } from "@/lib/pdf/invoice";

/**
 * Streams a generated PDF for one invoice. Admins can download any invoice
 * in their organization; clients can only download invoices for their own
 * projects, and never a "draft" (not yet sent to them) — same scoping rule
 * as the Payments page.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const repo = getRepository();

  const payment = await repo.getPayment(id);
  if (!payment || payment.organization_id !== user.organizationId) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const scope = await getAccessibleProjectIds(repo, user);
  if (scope && !scope.has(payment.project_id)) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (user.role === "client" && payment.status === "draft") {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const [project, client, org] = await Promise.all([
    repo.getProject(payment.project_id),
    repo.getClient(payment.client_id),
    repo.getOrganization(payment.organization_id),
  ]);
  const clientProfile = client ? await repo.getProfile(client.profile_id) : null;

  const pdfBytes = await generateInvoicePdf({ payment, project, client, clientProfile, org });

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${payment.invoice_number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
