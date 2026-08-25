"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, X, CalendarClock, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { respondAvailabilityRequestAction } from "@/lib/actions/availability";
import type { AvailabilityRequest } from "@/types/domain";

const STATUS_VARIANT: Record<AvailabilityRequest["status"], "warning" | "success" | "danger" | "info"> = {
  pending: "warning",
  accepted: "success",
  declined: "danger",
  rescheduled: "info",
};

export function RequestCard({
  request,
  requesterName,
  canRespond,
}: {
  request: AvailabilityRequest;
  requesterName?: string;
  canRespond: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [showReschedule, setShowReschedule] = useState(false);
  const [altDate, setAltDate] = useState(request.date);
  const [altStart, setAltStart] = useState(request.start);
  const [altEnd, setAltEnd] = useState(request.end);

  function respond(status: "accepted" | "declined" | "rescheduled") {
    startTransition(async () => {
      try {
        await respondAvailabilityRequestAction(
          request.id,
          status,
          undefined,
          status === "rescheduled" ? { date: altDate, start: altStart, end: altEnd } : undefined
        );
        toast.success(`Request ${status}`);
        setShowReschedule(false);
      } catch {
        toast.error("Couldn't respond to that request");
      }
    });
  }

  return (
    <Card className="p-0">
      <div className="p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-medium text-sm">{request.purpose}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {requesterName && `${requesterName} · `}
              {formatDate(request.date + "T00:00:00", { weekday: "short", month: "short", day: "numeric" })} ·{" "}
              {request.start}–{request.end}
            </div>
          </div>
          <Badge variant={STATUS_VARIANT[request.status]} className="capitalize shrink-0">{request.status}</Badge>
        </div>

        {canRespond && request.status === "pending" && (
          <div className="space-y-2 pt-1">
            {!showReschedule ? (
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" disabled={pending} onClick={() => respond("accepted")}>
                  {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  Accept
                </Button>
                <Button size="sm" variant="outline" className="flex-1" disabled={pending} onClick={() => setShowReschedule(true)}>
                  <CalendarClock className="size-3.5" />
                  Propose new time
                </Button>
                <Button size="sm" variant="ghost" disabled={pending} onClick={() => respond("declined")}>
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <Input type="date" className="h-8" value={altDate} onChange={(e) => setAltDate(e.target.value)} />
                  <Input type="time" className="h-8" value={altStart} onChange={(e) => setAltStart(e.target.value)} />
                  <Input type="time" className="h-8" value={altEnd} onChange={(e) => setAltEnd(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={pending} onClick={() => respond("rescheduled")} className="flex-1">
                    Propose
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowReschedule(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {request.status === "rescheduled" && request.proposed_alternative && (
          <div className="text-xs text-status-info bg-status-info-bg rounded-lg px-2.5 py-1.5">
            Proposed: {formatDate(request.proposed_alternative.date + "T00:00:00")} {request.proposed_alternative.start}–{request.proposed_alternative.end}
          </div>
        )}
      </div>
    </Card>
  );
}
