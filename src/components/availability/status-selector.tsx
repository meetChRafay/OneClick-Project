"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { updateAvailabilityStatusAction } from "@/lib/actions/availability";
import type { AvailabilityStatusValue } from "@/types/domain";

const OPTIONS: { value: AvailabilityStatusValue; label: string; dot: string }[] = [
  { value: "available", label: "Available", dot: "bg-status-success" },
  { value: "busy", label: "Busy", dot: "bg-status-warning" },
  { value: "away", label: "Away", dot: "bg-status-neutral" },
  { value: "dnd", label: "Do Not Disturb", dot: "bg-status-danger" },
];

export function StatusSelector({
  currentStatus,
  currentMessage,
}: {
  currentStatus: AvailabilityStatusValue;
  currentMessage?: string | null;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [message, setMessage] = useState(currentMessage ?? "");
  const [pending, startTransition] = useTransition();

  function save(next: AvailabilityStatusValue, msg: string) {
    startTransition(async () => {
      try {
        await updateAvailabilityStatusAction(next, msg || undefined);
        toast.success("Status updated");
      } catch {
        toast.error("Couldn't update your status");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            disabled={pending}
            onClick={() => {
              setStatus(o.value);
              save(o.value, message);
            }}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors cursor-pointer disabled:opacity-60",
              status === o.value ? "border-primary bg-accent" : "hover:bg-accent/60"
            )}
          >
            {pending && status === o.value ? (
              <Loader2 className="size-2.5 animate-spin" />
            ) : (
              <span className={cn("size-2.5 rounded-full", o.dot)} />
            )}
            {o.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Status message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="h-8 text-sm"
        />
        <Button size="sm" variant="outline" className="h-8" disabled={pending} onClick={() => save(status, message)}>
          Save
        </Button>
      </div>
    </div>
  );
}
