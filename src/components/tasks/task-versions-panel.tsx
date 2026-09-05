"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, GitCommitVertical, Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { normalizeExternalUrl, relativeTime } from "@/lib/utils";
import { addTaskVersionAction, updateTaskVersionStatusAction, deleteTaskVersionAction } from "@/lib/actions/task-versions";
import type { TaskVersion, TaskVersionStatus } from "@/types/domain";

type BadgeVariant = "neutral" | "info" | "warning" | "success";

const STATUS_META: Record<TaskVersionStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: "Draft", variant: "neutral" },
  sent_for_review: { label: "Sent for Client Review", variant: "info" },
  revision_requested: { label: "Revision Requested", variant: "warning" },
  approved_final: { label: "Final / Approved", variant: "success" },
};

const STATUS_OPTIONS = Object.entries(STATUS_META) as [TaskVersionStatus, { label: string; variant: BadgeVariant }][];

export function TaskVersionsPanel({
  taskId,
  versions,
  authorNames,
  editable,
}: {
  taskId: string;
  versions: TaskVersion[];
  authorNames: Map<string, string>;
  editable: boolean;
}) {
  const sorted = [...versions].sort((a, b) => b.version_number - a.version_number);

  return (
    <div className="space-y-4">
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No versions logged yet. Add the first cut below.
        </p>
      ) : (
        <div className="space-y-3">
          {sorted.map((v) => (
            <VersionRow key={v.id} taskId={taskId} version={v} authorName={authorNames.get(v.created_by)} editable={editable} />
          ))}
        </div>
      )}

      {editable && <AddVersionForm taskId={taskId} />}
    </div>
  );
}

function VersionRow({
  taskId,
  version,
  authorName,
  editable,
}: {
  taskId: string;
  version: TaskVersion;
  authorName?: string;
  editable: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const meta = STATUS_META[version.status];

  function changeStatus(status: TaskVersionStatus) {
    startTransition(async () => {
      try {
        await updateTaskVersionStatusAction(taskId, version.id, status);
        toast.success("Status updated");
      } catch {
        toast.error("Couldn't update the status");
      }
    });
  }

  const boundDelete = async () => {
    await deleteTaskVersionAction(taskId, version.id);
  };

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1 font-mono text-[11px]">
            <GitCommitVertical className="size-3" /> V{version.version_number}
          </Badge>
          {editable ? (
            <Select value={version.status} onValueChange={(v) => changeStatus(v as TaskVersionStatus)} disabled={pending}>
              <SelectTrigger className="h-6 w-auto text-xs border-none shadow-none px-2 gap-1 [&>svg]:size-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(([value, m]) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={meta.variant}>{meta.label}</Badge>
          )}
        </div>
        {editable && (
          <div className="opacity-70 hover:opacity-100 transition-opacity">
            <ConfirmDeleteButton label="version" itemName={`V${version.version_number}`} action={boundDelete} />
          </div>
        )}
      </div>

      {version.notes && <p className="text-sm whitespace-pre-wrap">{version.notes}</p>}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        {version.drive_url ? (
          <a
            href={normalizeExternalUrl(version.drive_url) ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            Open this version <ExternalLink className="size-3" />
          </a>
        ) : (
          <span />
        )}
        <span className="text-xs text-muted-foreground">
          {authorName ?? "Someone"} · {relativeTime(version.created_at)}
        </span>
      </div>
    </div>
  );
}

function AddVersionForm({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false);
  const [driveUrl, setDriveUrl] = useState("");
  const [status, setStatus] = useState<TaskVersionStatus>("sent_for_review");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      try {
        await addTaskVersionAction(taskId, { status, driveUrl, notes });
        setDriveUrl("");
        setNotes("");
        setStatus("sent_for_review");
        setOpen(false);
        toast.success("Version added");
      } catch {
        toast.error("Couldn't add that version");
      }
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="w-full">
        <Plus className="size-3.5" /> Add a version
      </Button>
    );
  }

  return (
    <div className="rounded-lg border p-3 space-y-2.5">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Drive link for this version</Label>
        <Input
          placeholder="Paste the Google Drive link for this cut…"
          value={driveUrl}
          onChange={(e) => setDriveUrl(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as TaskVersionStatus)}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(([value, m]) => (
              <SelectItem key={value} value={value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Notes (what changed, optional)</Label>
        <Textarea
          placeholder="e.g. shortened intro, removed background music at 0:45"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>
      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
        <Button size="sm" onClick={submit} disabled={pending}>
          {pending && <Loader2 className="size-3.5 animate-spin" />}
          Save version
        </Button>
      </div>
    </div>
  );
}
