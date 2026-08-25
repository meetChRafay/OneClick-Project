"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  CheckSquare,
  FolderKanban,
  Sparkles,
  AlertTriangle,
  Upload,
  Clock,
  CalendarPlus,
  UserPlus,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTaskAction } from "@/lib/actions/tasks";
import { createProjectAction } from "@/lib/actions/projects";
import { createTopicAction } from "@/lib/actions/topics";
import { createIssueAction } from "@/lib/actions/issues";
import { createAvailabilityRequestAction } from "@/lib/actions/availability";
import { createCalendarEventAction } from "@/lib/actions/calendar";
import { inviteClientAction } from "@/lib/actions/clients";

type QuickAddType = "task" | "project" | "topic" | "issue" | "file" | "availability" | "meeting" | "client";

interface Option {
  id: string;
  name: string;
}

export function QuickAddModal({
  projects,
  members,
  clients,
}: {
  projects: Option[];
  members: Option[];
  clients: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<QuickAddType | null>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setType(null);
  }

  function submit(fn: () => Promise<unknown>, successMsg: string) {
    startTransition(async () => {
      try {
        await fn();
        toast.success(successMsg);
        close();
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  const TYPES: { type: QuickAddType; label: string; icon: typeof Plus }[] = [
    { type: "task", label: "New Task", icon: CheckSquare },
    { type: "project", label: "New Project", icon: FolderKanban },
    { type: "topic", label: "New Topic", icon: Sparkles },
    { type: "issue", label: "New Issue", icon: AlertTriangle },
    { type: "file", label: "Upload File", icon: Upload },
    { type: "availability", label: "Request Availability", icon: Clock },
    { type: "meeting", label: "Schedule Meeting", icon: CalendarPlus },
    { type: "client", label: "Add Client", icon: UserPlus },
  ];

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5 shadow-sm">
        <Plus className="size-4" />
        <span className="hidden sm:inline">Add</span>
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setType(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {!type ? (
            <>
              <DialogHeader>
                <DialogTitle>Quick add</DialogTitle>
                <DialogDescription>Create something new without leaving this page.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.type}
                    onClick={() => setType(t.type)}
                    className="flex flex-col items-start gap-2 rounded-lg border p-3 text-left hover:bg-accent hover:border-ring/40 transition-colors cursor-pointer"
                  >
                    <t.icon className="size-4 text-primary" />
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <button
                  onClick={() => setType(null)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1 cursor-pointer w-fit"
                >
                  <ChevronLeft className="size-3.5" /> Back
                </button>
                <DialogTitle>{TYPES.find((t) => t.type === type)?.label}</DialogTitle>
              </DialogHeader>

              {type === "task" && (
                <TaskForm
                  projects={projects}
                  members={members}
                  pending={pending}
                  onSubmit={(v) =>
                    submit(
                      () =>
                        createTaskAction({
                          projectId: v.projectId,
                          title: v.title,
                          assigneeId: v.assigneeId || null,
                          deadline: v.deadline || null,
                        }),
                      "Task created"
                    )
                  }
                />
              )}

              {type === "project" && (
                <ProjectForm
                  clients={clients}
                  pending={pending}
                  onSubmit={(v) =>
                    submit(
                      () => createProjectAction({ name: v.name, clientId: v.clientId, deadline: v.deadline || null }),
                      "Project created"
                    )
                  }
                />
              )}

              {type === "topic" && (
                <TopicForm
                  projects={projects}
                  pending={pending}
                  onSubmit={(v) =>
                    submit(() => createTopicAction({ projectId: v.projectId, title: v.title }), "Topic added")
                  }
                />
              )}

              {type === "issue" && (
                <IssueForm
                  projects={projects}
                  members={members}
                  pending={pending}
                  onSubmit={(v) =>
                    submit(
                      () => createIssueAction({ projectId: v.projectId, title: v.title, assigneeId: v.assigneeId || null }),
                      "Issue reported"
                    )
                  }
                />
              )}

              {type === "file" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Head to the Files page to upload — you can drag and drop directly onto any project.
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => {
                      close();
                      router.push("/files");
                    }}
                  >
                    Go to Files
                  </Button>
                </div>
              )}

              {type === "availability" && (
                <AvailabilityForm
                  members={members}
                  pending={pending}
                  onSubmit={(v) =>
                    submit(
                      () =>
                        createAvailabilityRequestAction({
                          requestedOf: v.requestedOf,
                          date: v.date,
                          start: v.start,
                          end: v.end,
                          purpose: v.purpose,
                        }),
                      "Availability request sent"
                    )
                  }
                />
              )}

              {type === "meeting" && (
                <MeetingForm
                  projects={projects}
                  pending={pending}
                  onSubmit={(v) =>
                    submit(
                      () =>
                        createCalendarEventAction({
                          projectId: v.projectId || null,
                          title: v.title,
                          type: "meeting",
                          start: v.start,
                          end: v.end,
                        }),
                      "Meeting scheduled"
                    )
                  }
                />
              )}

              {type === "client" && (
                <ClientForm
                  pending={pending}
                  onSubmit={(v) =>
                    submit(
                      () => inviteClientAction({ clientName: v.name, email: v.email, companyName: v.company }),
                      "Client invited"
                    )
                  }
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function TaskForm({
  projects,
  members,
  pending,
  onSubmit,
}: {
  projects: Option[];
  members: Option[];
  pending: boolean;
  onSubmit: (v: { title: string; projectId: string; assigneeId: string; deadline: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [assigneeId, setAssigneeId] = useState("");
  const [deadline, setDeadline] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ title, projectId, assigneeId, deadline });
      }}
    >
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Finish Video #3" required autoFocus />
      </div>
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Assignee</Label>
          <Select value={assigneeId} onValueChange={setAssigneeId}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Unassigned" /></SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Deadline</Label>
          <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={pending || !title || !projectId}>Create task</Button>
    </form>
  );
}

function ProjectForm({
  clients,
  pending,
  onSubmit,
}: {
  clients: Option[];
  pending: boolean;
  onSubmit: (v: { name: string; clientId: string; deadline: string }) => void;
}) {
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [deadline, setDeadline] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, clientId, deadline });
      }}
    >
      <div className="space-y-1.5">
        <Label>Project name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q1 Product Launch" required autoFocus />
      </div>
      <div className="space-y-1.5">
        <Label>Client</Label>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Deadline</Label>
        <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={pending || !name || !clientId}>Create project</Button>
    </form>
  );
}

function TopicForm({
  projects,
  pending,
  onSubmit,
}: {
  projects: Option[];
  pending: boolean;
  onSubmit: (v: { title: string; projectId: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ title, projectId });
      }}
    >
      <div className="space-y-1.5">
        <Label>Topic title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. What Causes Spider Veins?" required autoFocus />
      </div>
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
      <Button type="submit" className="w-full" disabled={pending || !title}>Add topic</Button>
    </form>
  );
}

function IssueForm({
  projects,
  members,
  pending,
  onSubmit,
}: {
  projects: Option[];
  members: Option[];
  pending: boolean;
  onSubmit: (v: { title: string; projectId: string; assigneeId: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [assigneeId, setAssigneeId] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ title, projectId, assigneeId });
      }}
    >
      <div className="space-y-1.5">
        <Label>Issue title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Upload problem" required autoFocus />
      </div>
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
      <Button type="submit" className="w-full" disabled={pending || !title}>Report issue</Button>
    </form>
  );
}

function AvailabilityForm({
  members,
  pending,
  onSubmit,
}: {
  members: Option[];
  pending: boolean;
  onSubmit: (v: { requestedOf: string; date: string; start: string; end: string; purpose: string }) => void;
}) {
  const [requestedOf, setRequestedOf] = useState(members[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [purpose, setPurpose] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ requestedOf, date, start, end, purpose });
      }}
    >
      <div className="space-y-1.5">
        <Label>Ask</Label>
        <Select value={requestedOf} onValueChange={setRequestedOf}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Start</Label>
          <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>End</Label>
          <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Purpose</Label>
        <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Review Video #3" required />
      </div>
      <Button type="submit" className="w-full" disabled={pending || !date || !start || !end || !purpose}>
        Send request
      </Button>
    </form>
  );
}

function MeetingForm({
  projects,
  pending,
  onSubmit,
}: {
  projects: Option[];
  pending: boolean;
  onSubmit: (v: { title: string; projectId: string; start: string; end: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ title, projectId, start, end });
      }}
    >
      <div className="space-y-1.5">
        <Label>Meeting title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Video #3 Review Call" required autoFocus />
      </div>
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Start</Label>
          <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>End</Label>
          <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={pending || !title || !start || !end}>Schedule</Button>
    </form>
  );
}

function ClientForm({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (v: { name: string; email: string; company: string }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, email, company });
      }}
    >
      <div className="space-y-1.5">
        <Label>Client name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane Cooper" required autoFocus />
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" required />
      </div>
      <div className="space-y-1.5">
        <Label>Company</Label>
        <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" />
      </div>
      <Button type="submit" className="w-full" disabled={pending || !name || !email}>Send invitation</Button>
    </form>
  );
}
