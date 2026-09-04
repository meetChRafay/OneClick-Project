"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTaskAction, updateTaskStatusAction } from "@/lib/actions/tasks";
import type { Priority, Task, TaskStatus, WaitingFor } from "@/types/domain";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "internal_review", label: "Internal Review" },
  { value: "client_review", label: "Client Review" },
  { value: "waiting_client", label: "Waiting for Client" },
  { value: "waiting_me", label: "Waiting for Me" },
  { value: "corrections_required", label: "Corrections Required" },
  { value: "blocked", label: "Blocked" },
  { value: "final_approval", label: "Final Approval" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function TaskDetailEditor({
  task,
  members,
  editable,
}: {
  task: Task;
  members: { id: string; name: string }[];
  editable: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function update(patch: Partial<Task>, message: string) {
    startTransition(async () => {
      try {
        if (patch.status) await updateTaskStatusAction(task.id, patch.status);
        else await updateTaskAction(task.id, patch);
        toast.success(message);
      } catch {
        toast.error("Couldn't save that change");
      }
    });
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select
          disabled={!editable || pending}
          value={task.status}
          onValueChange={(v) => update({ status: v as TaskStatus }, "Status updated")}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Priority</Label>
        <Select
          disabled={!editable || pending}
          value={task.priority}
          onValueChange={(v) => update({ priority: v as Priority }, "Priority updated")}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Assignee</Label>
        <Select
          disabled={!editable || pending}
          value={task.assignee_id ?? "unassigned"}
          onValueChange={(v) => update({ assignee_id: v === "unassigned" ? null : v }, "Assignee updated")}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Waiting for</Label>
        <Select
          disabled={!editable || pending}
          value={task.waiting_for}
          onValueChange={(v) => update({ waiting_for: v as WaitingFor }, "Updated")}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="nobody">Nobody</SelectItem>
            <SelectItem value="me">Me</SelectItem>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 col-span-2">
        <Label className="text-xs text-muted-foreground">Deadline</Label>
        <Input
          type="datetime-local"
          disabled={!editable || pending}
          defaultValue={task.deadline ? task.deadline.slice(0, 16) : ""}
          onBlur={(e) => {
            const value = e.target.value ? new Date(e.target.value).toISOString() : null;
            if (value !== task.deadline) update({ deadline: value }, "Deadline updated");
          }}
        />
      </div>

      <div className="space-y-1.5 col-span-2">
        <Label className="text-xs text-muted-foreground">Video / file link (Google Drive)</Label>
        <Input
          type="url"
          placeholder="Paste this task's Google Drive link here…"
          disabled={!editable || pending}
          defaultValue={task.drive_url ?? ""}
          onBlur={(e) => {
            const value = e.target.value.trim() || null;
            if (value !== (task.drive_url ?? null)) update({ drive_url: value }, "Link saved");
          }}
        />
        {task.drive_url && (
          <a href={task.drive_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-block mt-0.5">
            Open link ↗
          </a>
        )}
      </div>
    </div>
  );
}
