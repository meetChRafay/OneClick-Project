"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updatePaymentStatusAction } from "@/lib/actions/payments";
import type { PaymentStatus } from "@/types/domain";

const OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

export function PaymentStatusSelect({ paymentId, status }: { paymentId: string; status: PaymentStatus }) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      disabled={pending}
      value={status}
      onValueChange={(v) =>
        startTransition(async () => {
          try {
            await updatePaymentStatusAction(paymentId, v as PaymentStatus);
            toast.success(v === "paid" ? "Marked as paid" : "Invoice updated");
          } catch {
            toast.error("Couldn't update that invoice");
          }
        })
      }
    >
      <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
