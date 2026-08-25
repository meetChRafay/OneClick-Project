"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, ChevronRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/priority-badge";
import { UserAvatar } from "@/components/user-avatar";
import { cn, formatDate } from "@/lib/utils";
import { WORKFLOW_STAGES, nextWorkflowStage, workflowIndex } from "@/lib/workflow";
import { advanceTopicStageAction } from "@/lib/actions/topics";
import type { Topic } from "@/types/domain";

export function TopicDetailDialog({
  topic,
  assigneeName,
  projectName,
  canEdit,
  open,
  onOpenChange,
}: {
  topic: Topic;
  assigneeName?: string | null;
  projectName?: string;
  canEdit: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const currentIdx = workflowIndex(topic.workflow_stage);
  const next = nextWorkflowStage(topic.workflow_stage);

  function advance() {
    if (!next) return;
    startTransition(async () => {
      try {
        await advanceTopicStageAction(topic.id, next);
        toast.success(`Moved to ${WORKFLOW_STAGES.find((s) => s.value === next)?.label}`);
      } catch {
        toast.error("Couldn't update the stage");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{topic.title}</DialogTitle>
          <DialogDescription>
            {projectName} {topic.description ? `· ${topic.description}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={topic.priority} />
          {topic.expected_start && (
            <span className="text-xs text-muted-foreground">Expected start {formatDate(topic.expected_start)}</span>
          )}
          {assigneeName && (
            <div className="flex items-center gap-1.5 ml-auto">
              <UserAvatar name={assigneeName} size="sm" />
              <span className="text-sm">{assigneeName}</span>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-3">Video production workflow</h4>
          <div className="flex flex-wrap gap-1.5">
            {WORKFLOW_STAGES.map((s, i) => {
              const done = i < currentIdx;
              const current = i === currentIdx;
              return (
                <div
                  key={s.value}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border",
                    done && "bg-status-success-bg text-status-success border-transparent",
                    current && "bg-primary text-primary-foreground border-transparent",
                    !done && !current && "text-muted-foreground border-border"
                  )}
                >
                  {done && <Check className="size-3" />}
                  {s.label}
                </div>
              );
            })}
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">
              {next ? `Next: ${WORKFLOW_STAGES.find((s) => s.value === next)?.label}` : "This topic is fully published"}
            </span>
            {next && (
              <Button size="sm" onClick={advance} disabled={pending}>
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : <ChevronRight className="size-3.5" />}
                Advance stage
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
