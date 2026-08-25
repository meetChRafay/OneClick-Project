"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateIssueStatusAction } from "@/lib/actions/issues";
import type { IssueStatus } from "@/types/domain";

const OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting", label: "Waiting" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export function IssueStatusSelect({ issueId, status, editable }: { issueId: string; status: IssueStatus; editable: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      disabled={!editable || pending}
      value={status}
      onValueChange={(v) =>
        startTransition(async () => {
          try {
            await updateIssueStatusAction(issueId, v as IssueStatus);
            toast.success("Status updated");
          } catch {
            toast.error("Couldn't update the status");
          }
        })
      }
    >
      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
