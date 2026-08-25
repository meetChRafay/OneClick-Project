"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createIssueAction } from "@/lib/actions/issues";

export function NewIssueDialog({
  projects,
  members,
}: {
  projects: { id: string; name: string }[];
  members: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createIssueAction({ projectId, title, description, assigneeId: assigneeId || null, priority });
        toast.success("Issue reported");
        setOpen(false);
        setTitle("");
        setDescription("");
        router.refresh();
      } catch {
        toast.error("Couldn't report that issue");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New Issue
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report an issue</DialogTitle>
          <DialogDescription>Flag a problem that needs attention.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Upload problem" required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {members.length > 0 && (
            <div className="space-y-1.5">
              <Label>Assign to</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={pending || !title || !projectId}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Report issue
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
