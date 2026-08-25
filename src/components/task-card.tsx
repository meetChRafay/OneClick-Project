"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { TaskStatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { WaitingForBadge } from "@/components/waiting-for-badge";
import { DeadlineIndicator } from "@/components/deadline-indicator";
import { updateTaskStatusAction } from "@/lib/actions/tasks";
import type { Task } from "@/types/domain";

export function TaskCard({
  task,
  projectName,
  assigneeName,
  waitingForName,
  compact = false,
}: {
  task: Task;
  projectName?: string;
  assigneeName?: string | null;
  waitingForName?: string | null;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const isCompleted = task.status === "completed";

  function markComplete() {
    startTransition(async () => {
      try {
        await updateTaskStatusAction(task.id, "completed");
        toast.success(`Marked "${task.title}" as complete`);
      } catch {
        toast.error("Couldn't update the task. Please try again.");
      }
    });
  }

  return (
    <Card className="p-0 hover:shadow-md transition-shadow">
      <div className="p-4 flex items-start gap-3">
        <button
          onClick={markComplete}
          disabled={pending || isCompleted}
          className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors disabled:cursor-default cursor-pointer data-[done=true]:bg-status-success data-[done=true]:border-status-success data-[done=true]:text-white hover:border-primary"
          data-done={isCompleted}
          aria-label="Mark complete"
        >
          {pending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : isCompleted ? (
            <Check className="size-3" />
          ) : null}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/tasks/${task.id}`} className="font-medium text-sm hover:underline truncate">
              {task.title}
            </Link>
          </div>
          {!compact && projectName && (
            <div className="text-xs text-muted-foreground mt-0.5 truncate">{projectName}</div>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            <DeadlineIndicator deadline={task.deadline} completed={isCompleted} />
            <WaitingForBadge waitingFor={task.waiting_for} personName={waitingForName} />
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {assigneeName && <UserAvatar name={assigneeName} size="sm" />}
          {!isCompleted && (
            <Button size="sm" variant="outline" className="h-7 text-xs px-2" asChild>
              <Link href={`/tasks/${task.id}`}>Open</Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
