import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaymentStatusBadge } from "@/components/status-badge";
import { PaymentStatusSelect } from "@/components/payments/payment-status-select";
import { formatCurrency, formatDate, isOverdue } from "@/lib/utils";
import type { Payment } from "@/types/domain";

export function PaymentTable({
  payments,
  projectNames,
  showProject = true,
  editable,
}: {
  payments: Payment[];
  projectNames?: Map<string, string>;
  showProject?: boolean;
  editable: boolean;
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            {showProject && <TableHead>Project</TableHead>}
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => {
            const overdue = p.status === "sent" && isOverdue(p.due_date);
            return (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.invoice_number}</TableCell>
                {showProject && (
                  <TableCell className="text-muted-foreground">
                    {projectNames?.get(p.project_id) ?? "—"}
                  </TableCell>
                )}
                <TableCell className="max-w-64 truncate whitespace-normal" title={p.description}>
                  {p.description}
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(p.amount, p.currency)}</TableCell>
                <TableCell className={overdue ? "text-status-danger" : "text-muted-foreground"}>
                  {formatDate(p.due_date, { month: "short", day: "numeric", year: "numeric" })}
                  {p.paid_date && p.status === "paid" && (
                    <span className="block text-xs text-muted-foreground">
                      Paid {formatDate(p.paid_date, { month: "short", day: "numeric" })}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editable ? (
                    <PaymentStatusSelect paymentId={p.id} status={p.status} />
                  ) : (
                    <PaymentStatusBadge status={overdue ? "overdue" : p.status} />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
