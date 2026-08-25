"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCalendarEventAction } from "@/lib/actions/calendar";
import type { CalendarEventType } from "@/types/domain";

const TYPES: { value: CalendarEventType; label: string }[] = [
  { value: "meeting", label: "Meeting" },
  { value: "review_session", label: "Review session" },
  { value: "publish_date", label: "Publish date" },
  { value: "milestone", label: "Milestone" },
];

export function NewEventDialog({
  projects,
  profiles,
}: {
  projects: { id: string; name: string }[];
  profiles: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<CalendarEventType>("meeting");
  const [projectId, setProjectId] = useState<string>("none");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [location, setLocation] = useState("");
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);

  function reset() {
    setTitle("");
    setStart("");
    setEnd("");
    setLocation("");
    setAttendeeIds([]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createCalendarEventAction({
          title,
          type,
          projectId: projectId === "none" ? null : projectId,
          start: new Date(start).toISOString(),
          end: new Date(end || start).toISOString(),
          location: location || undefined,
          attendeeIds,
        });
        toast.success("Event scheduled");
        setOpen(false);
        reset();
        router.refresh();
      } catch {
        toast.error("Couldn't schedule that event");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New Event
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule an event</DialogTitle>
          <DialogDescription>Add a meeting, review session, publish date or milestone.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Video #3 Review Call" required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as CalendarEventType)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start</Label>
              <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Location (optional)</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Google Meet" />
          </div>
          {profiles.length > 0 && (
            <div className="space-y-1.5">
              <Label>Attendees</Label>
              <ScrollArea className="h-28 rounded-lg border p-2">
                <div className="space-y-1.5">
                  {profiles.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={attendeeIds.includes(p.id)}
                        onCheckedChange={(checked) =>
                          setAttendeeIds((prev) => (checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)))
                        }
                      />
                      {p.name}
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={pending || !title || !start}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Schedule
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
