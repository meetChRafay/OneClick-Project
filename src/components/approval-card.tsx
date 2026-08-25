"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApprovalStatusBadge } from "@/components/status-badge";
import { relativeTime } from "@/lib/utils";
import { decideApprovalAction } from "@/lib/actions/approvals";
import type { Approval } from "@/types/domain";

export function ApprovalCard({
  approval,
  projectName,
  canDecide,
  linkToDetail = true,
}: {
  approval: Approval;
  projectName?: string;
  canDecide?: boolean;
  linkToDetail?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [showChangesForm, setShowChangesForm] = useState(false);
  const [feedback, setFeedback] = useState("");

  function approve() {
    startTransition(async () => {
      await decideApprovalAction(approval.id, "approved");
      toast.success("Approved");
    });
  }

  function requestChanges() {
    if (!feedback.trim()) return;
    startTransition(async () => {
      await decideApprovalAction(approval.id, "changes_requested", feedback);
      toast.success("Changes requested");
      setShowChangesForm(false);
    });
  }

  const titleEl = linkToDetail ? (
    <Link href={`/approvals/${approval.id}`} className="font-medium text-sm hover:underline">
      {approval.title}
    </Link>
  ) : (
    <span className="font-medium text-sm">{approval.title}</span>
  );

  return (
    <Card className="p-0">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {titleEl}
            <div className="text-xs text-muted-foreground mt-0.5">
              {projectName && `${projectName} · `}requested {relativeTime(approval.created_at)}
            </div>
          </div>
          <ApprovalStatusBadge status={approval.status} className="shrink-0" />
        </div>

        {approval.status === "changes_requested" && approval.feedback && (
          <div className="rounded-lg bg-status-danger-bg text-status-danger text-sm px-3 py-2">
            &ldquo;{approval.feedback}&rdquo;
          </div>
        )}
        {approval.status === "approved" && approval.feedback && (
          <div className="rounded-lg bg-status-success-bg text-status-success text-sm px-3 py-2">
            &ldquo;{approval.feedback}&rdquo;
          </div>
        )}

        {canDecide && approval.status === "waiting_client" && (
          <div className="space-y-2 pt-1">
            {!showChangesForm ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={approve} disabled={pending} className="flex-1">
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowChangesForm(true)} disabled={pending} className="flex-1">
                  <X className="size-4" />
                  Request Changes
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea
                  autoFocus
                  placeholder="What changes are required?"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={requestChanges} disabled={pending || !feedback.trim()} className="flex-1">
                    {pending && <Loader2 className="size-4 animate-spin" />}
                    Send feedback
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowChangesForm(false)} disabled={pending}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
