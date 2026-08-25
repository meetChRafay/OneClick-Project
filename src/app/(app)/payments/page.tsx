import type { Metadata } from "next";
import { DollarSign, CheckCircle2, AlarmClockOff, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { getAccessibleProjectIds } from "@/lib/authz";
import { PageHeader } from "@/components/page-header";
import { SummaryCard } from "@/components/summary-card";
import { EmptyState } from "@/components/empty-state";
import { PaymentTable } from "@/components/payments/payment-table";
import { NewPaymentDialog } from "@/components/payments/new-payment-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency, isOverdue } from "@/lib/utils";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const user = await requireUser();
  const repo = getRepository();

  const scope = await getAccessibleProjectIds(repo, user);
  const [allPayments, projects] = await Promise.all([
    repo.listPayments(user.organizationId),
    repo.listProjects(user.organizationId, user.role === "client" ? { profileId: user.id } : undefined),
  ]);

  const scoped = allPayments.filter((p) => !scope || scope.has(p.project_id));
  // Clients only ever see invoices that have actually been sent to them.
  const payments = user.role === "client" ? scoped.filter((p) => p.status !== "draft") : scoped;

  const projectNames = new Map(projects.map((p) => [p.id, p.name]));
  const effectivelyOverdue = (p: (typeof payments)[number]) => p.status === "overdue" || (p.status === "sent" && isOverdue(p.due_date));

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const outstanding = payments.filter((p) => p.status === "sent" || p.status === "overdue").reduce((s, p) => s + p.amount, 0);
  const overdueAmount = payments.filter(effectivelyOverdue).reduce((s, p) => s + p.amount, 0);
  const overdueCount = payments.filter(effectivelyOverdue).length;

  const tabs = [
    { value: "outstanding", label: "Outstanding", items: payments.filter((p) => p.status === "sent" || p.status === "overdue") },
    { value: "paid", label: "Paid", items: payments.filter((p) => p.status === "paid") },
    ...(user.role === "admin" ? [{ value: "draft", label: "Drafts", items: payments.filter((p) => p.status === "draft") }] : []),
    { value: "all", label: "All", items: payments },
  ];

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle={`${payments.length} invoice${payments.length === 1 ? "" : "s"}`}
        actions={
          user.role === "admin" ? (
            <NewPaymentDialog projects={projects.map((p) => ({ id: p.id, name: p.name, clientId: p.client_id }))} />
          ) : undefined
        }
      />
      <div className="px-4 lg:px-6 pb-10 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard label="Total Paid" value={formatCurrency(totalPaid)} icon={CheckCircle2} tone="success" />
          <SummaryCard label="Outstanding" value={formatCurrency(outstanding)} icon={DollarSign} tone="info" />
          <SummaryCard
            label="Overdue"
            value={formatCurrency(overdueAmount)}
            icon={AlarmClockOff}
            tone="danger"
            hint={overdueCount > 0 ? `${overdueCount} invoice${overdueCount === 1 ? "" : "s"}` : undefined}
          />
          <SummaryCard label="Invoices" value={payments.length} icon={FileText} tone="neutral" />
        </div>

        <Tabs defaultValue="outstanding">
          <TabsList className="mb-4">
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label} ({t.items.length})
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((t) => (
            <TabsContent key={t.value} value={t.value}>
              {t.items.length === 0 ? (
                <EmptyState icon={DollarSign} title="Nothing here" description="No invoices in this view." />
              ) : (
                <PaymentTable payments={t.items} projectNames={projectNames} editable={user.role === "admin"} />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
