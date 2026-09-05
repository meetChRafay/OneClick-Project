"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink, GitCommitVertical, ImagePlus, Loader2, Plus, RotateCcw, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { UserAvatar } from "@/components/user-avatar";
import { normalizeExternalUrl, relativeTime, formatDate } from "@/lib/utils";
import {
  addTaskVersionAction,
  updateTaskVersionAction,
  deleteTaskVersionAction,
  setVersionStatusAsClientAction,
} from "@/lib/actions/task-versions";
import { addVersionCommentAction } from "@/lib/actions/task-version-comments";
import type {
  Priority,
  RevisionCategory,
  TaskVersion,
  TaskVersionComment,
  TaskVersionStatus,
  WaitingFor,
} from "@/types/domain";

type BadgeVariant = "neutral" | "info" | "warning" | "success";

const STATUS_META: Record<TaskVersionStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: "Draft", variant: "neutral" },
  sent_for_review: { label: "Sent for Client Review", variant: "info" },
  revision_requested: { label: "Revision Requested", variant: "warning" },
  approved_final: { label: "Final / Approved", variant: "success" },
};
const STATUS_OPTIONS = Object.entries(STATUS_META) as [TaskVersionStatus, { label: string; variant: BadgeVariant }][];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const WAITING_OPTIONS: { value: WaitingFor; label: string }[] = [
  { value: "nobody", label: "Nobody" },
  { value: "me", label: "Me" },
  { value: "client", label: "Client" },
  { value: "both", label: "Both" },
];

const CATEGORY_OPTIONS: { value: RevisionCategory; label: string }[] = [
  { value: "video_length", label: "Video length / pacing" },
  { value: "audio", label: "Audio / music" },
  { value: "visuals_color", label: "Visuals / color" },
  { value: "captions_text", label: "Captions / text" },
  { value: "thumbnail", label: "Thumbnail" },
  { value: "other", label: "Other" },
];

export function TaskVersionsPanel({
  taskId,
  versions,
  commentsByVersion,
  authorNames,
  canManage,
}: {
  taskId: string;
  versions: TaskVersion[];
  commentsByVersion: Map<string, TaskVersionComment[]>;
  authorNames: Map<string, string>;
  /** true for admin: can add versions, edit their fields, change status, delete them */
  canManage: boolean;
}) {
  const sorted = [...versions].sort((a, b) => b.version_number - a.version_number);

  return (
    <div className="space-y-4">
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No versions logged yet. {canManage ? "Add the first cut below." : "Check back once your editor uploads the first cut."}
        </p>
      ) : (
        <div className="space-y-4">
          {sorted.map((v) => (
            <VersionCard
              key={v.id}
              taskId={taskId}
              version={v}
              comments={commentsByVersion.get(v.id) ?? []}
              authorNames={authorNames}
              canManage={canManage}
            />
          ))}
        </div>
      )}

      {canManage && <AddVersionForm taskId={taskId} />}
    </div>
  );
}

function VersionCard({
  taskId,
  version,
  comments,
  authorNames,
  canManage,
}: {
  taskId: string;
  version: TaskVersion;
  comments: TaskVersionComment[];
  authorNames: Map<string, string>;
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const meta = STATUS_META[version.status];

  function patch(update: Parameters<typeof updateTaskVersionAction>[2], message: string) {
    startTransition(async () => {
      try {
        await updateTaskVersionAction(taskId, version.id, update);
        toast.success(message);
      } catch {
        toast.error("Couldn't save that change");
      }
    });
  }

  const boundDelete = async () => {
    await deleteTaskVersionAction(taskId, version.id);
  };

  return (
    <div
      id={`version-${version.id}`}
      className="rounded-lg border p-3 space-y-3 scroll-mt-24 target:ring-2 target:ring-primary target:border-primary"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1 font-mono text-[11px]">
            <GitCommitVertical className="size-3" /> V{version.version_number}
          </Badge>
          {canManage ? (
            <Select value={version.status} onValueChange={(v) => patch({ status: v as TaskVersionStatus }, "Status updated")} disabled={pending}>
              <SelectTrigger className="h-6 w-auto text-xs border-none shadow-none px-2 gap-1 [&>svg]:size-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(([value, m]) => (
                  <SelectItem key={value} value={value} className="text-xs">{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={meta.variant}>{meta.label}</Badge>
          )}
        </div>
        {canManage && (
          <div className="opacity-70 hover:opacity-100 transition-opacity">
            <ConfirmDeleteButton label="version" itemName={`V${version.version_number}`} action={boundDelete} />
          </div>
        )}
      </div>

      {!canManage && <ClientVersionActions taskId={taskId} version={version} />}

      <div className="grid grid-cols-3 gap-2.5 text-xs">
        <div className="space-y-1">
          <div className="text-muted-foreground">Priority</div>
          {canManage ? (
            <Select value={version.priority} onValueChange={(v) => patch({ priority: v as Priority }, "Priority updated")} disabled={pending}>
              <SelectTrigger className="h-7 text-xs w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="capitalize mt-1.5">{version.priority}</div>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">Waiting for</div>
          {canManage ? (
            <Select value={version.waiting_for} onValueChange={(v) => patch({ waiting_for: v as WaitingFor }, "Updated")} disabled={pending}>
              <SelectTrigger className="h-7 text-xs w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {WAITING_OPTIONS.map((w) => (
                  <SelectItem key={w.value} value={w.value} className="text-xs">{w.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="capitalize mt-1.5">{version.waiting_for}</div>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">Deadline</div>
          {canManage ? (
            <Input
              type="date"
              className="h-7 text-xs"
              disabled={pending}
              defaultValue={version.deadline ? version.deadline.slice(0, 10) : ""}
              onBlur={(e) => {
                const value = e.target.value ? new Date(e.target.value).toISOString() : null;
                if (value !== (version.deadline ?? null)) patch({ deadline: value }, "Deadline updated");
              }}
            />
          ) : (
            <div className="mt-1.5">{version.deadline ? formatDate(version.deadline) : "—"}</div>
          )}
        </div>
      </div>

      {canManage ? (
        <Input
          placeholder="Paste this version's Drive link…"
          disabled={pending}
          defaultValue={version.drive_url ?? ""}
          onBlur={(e) => {
            const value = normalizeExternalUrl(e.target.value);
            if (value !== (version.drive_url ?? null)) patch({ drive_url: value }, "Link saved");
          }}
        />
      ) : version.drive_url ? (
        <a
          href={normalizeExternalUrl(version.drive_url) ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          Open this version <ExternalLink className="size-3" />
        </a>
      ) : null}

      {canManage ? (
        <Textarea
          placeholder="Notes — what changed in this cut…"
          rows={2}
          disabled={pending}
          defaultValue={version.notes ?? ""}
          onBlur={(e) => {
            const value = e.target.value.trim() || null;
            if (value !== (version.notes ?? null)) patch({ notes: value }, "Notes saved");
          }}
        />
      ) : version.notes ? (
        <p className="text-sm whitespace-pre-wrap">{version.notes}</p>
      ) : null}

      <div className="text-xs text-muted-foreground">
        Added by {authorNames.get(version.created_by) ?? "Someone"} · {relativeTime(version.created_at)}
      </div>

      <VersionCommentThread taskId={taskId} versionId={version.id} comments={comments} authorNames={authorNames} />
    </div>
  );
}

/** The client's own status buttons — a real action, not just a comment. */
function ClientVersionActions({ taskId, version }: { taskId: string; version: TaskVersion }) {
  const [pending, startTransition] = useTransition();

  function act(status: "revision_requested" | "approved_final", message: string) {
    startTransition(async () => {
      try {
        await setVersionStatusAsClientAction(taskId, version.id, status);
        toast.success(message);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't save that");
      }
    });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        size="sm"
        variant={version.status === "approved_final" ? "default" : "outline"}
        disabled={pending}
        onClick={() => act("approved_final", "Marked as approved")}
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
        Approve this version
      </Button>
      <Button
        size="sm"
        variant={version.status === "revision_requested" ? "default" : "outline"}
        disabled={pending}
        onClick={() => act("revision_requested", "Revision requested")}
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
        Request a revision
      </Button>
    </div>
  );
}

function VersionCommentThread({
  taskId,
  versionId,
  comments,
  authorNames,
}: {
  taskId: string;
  versionId: string;
  comments: TaskVersionComment[];
  authorNames: Map<string, string>;
}) {
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<RevisionCategory | "none">("none");
  const [imageName, setImageName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    const hasFile = !!fileRef.current?.files?.length;
    if (!body.trim() && category === "none" && !hasFile) {
      toast.error("Write feedback, pick a type, or attach an image first");
      return;
    }
    const formData = new FormData();
    formData.set("taskId", taskId);
    formData.set("versionId", versionId);
    formData.set("body", body.trim());
    if (category !== "none") formData.set("category", category);
    const file = fileRef.current?.files?.[0];
    if (file) formData.set("image", file);

    startTransition(async () => {
      try {
        await addVersionCommentAction(formData);
        setBody("");
        setCategory("none");
        setImageName("");
        if (fileRef.current) fileRef.current.value = "";
        toast.success("Feedback added");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't post that");
      }
    });
  }

  return (
    <div className="border-t pt-3 space-y-2.5">
      {comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <UserAvatar name={authorNames.get(c.author_id) ?? "?"} id={c.author_id} size="sm" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium">{authorNames.get(c.author_id) ?? "Unknown"}</span>
                  <span className="text-[11px] text-muted-foreground">{relativeTime(c.created_at)}</span>
                  {c.category && (
                    <Badge variant="outline" className="text-[10px]">
                      {CATEGORY_OPTIONS.find((o) => o.value === c.category)?.label ?? c.category}
                    </Badge>
                  )}
                </div>
                {c.body && <p className="text-sm whitespace-pre-wrap">{c.body}</p>}
                {c.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt="Feedback attachment" className="max-w-[240px] rounded-md border mt-1" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Textarea
          placeholder="Feedback on this version — what needs to change?"
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={category} onValueChange={(v) => setCategory(v as RevisionCategory | "none")}>
            <SelectTrigger className="h-8 text-xs w-auto min-w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">Type of revision (optional)</SelectItem>
              {CATEGORY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setImageName(e.target.files?.[0]?.name ?? "")}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={pending}>
            <ImagePlus className="size-3.5" /> {imageName || "Attach image"}
          </Button>
          <Button size="sm" className="ml-auto" onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            Post
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddVersionForm({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false);
  const [driveUrl, setDriveUrl] = useState("");
  const [status, setStatus] = useState<TaskVersionStatus>("sent_for_review");
  const [priority, setPriority] = useState<Priority>("medium");
  const [waitingFor, setWaitingFor] = useState<WaitingFor>("client");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      try {
        await addTaskVersionAction(taskId, {
          status,
          priority,
          waitingFor,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          driveUrl,
          notes,
        });
        setDriveUrl("");
        setNotes("");
        setDeadline("");
        setStatus("sent_for_review");
        setPriority("medium");
        setWaitingFor("client");
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
        <Input placeholder="Paste the Google Drive link for this cut…" value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
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
          <Label className="text-xs text-muted-foreground">Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Waiting for</Label>
          <Select value={waitingFor} onValueChange={(v) => setWaitingFor(v as WaitingFor)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {WAITING_OPTIONS.map((w) => (
                <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Deadline</Label>
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Notes (what changed, optional)</Label>
        <Textarea
          placeholder="e.g. shortened intro, removed background music at 0:45"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
        <Button size="sm" onClick={submit} disabled={pending}>
          {pending && <Loader2 className="size-3.5 animate-spin" />}
          Save version
        </Button>
      </div>
    </div>
  );
}
