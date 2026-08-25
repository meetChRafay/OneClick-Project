import Link from "next/link";
import {
  ListTodo,
  AlarmClockOff,
  Hourglass,
  UserCheck,
  TrendingUp,
  Clock,
  DollarSign,
} from "lucide-react";
import { getRepository } from "@/lib/data";
import type { CurrentUser } from "@/lib/data/repository";
import { computeTaskCounts, greeting, sortByPriorityAndDeadline } from "@/lib/domain-logic";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { SummaryCard } from "@/components/summary-card";
import { TaskCard } from "@/components/task-card";
import { NextTopicCard } from "@/components/next-topic-card";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AvailabilityBadge } from "@/components/availability-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { ProjectStatusBadge } from "@/components/status-badge";

export async function AdminDashboard({ user }: { user: CurrentUser }) {
  const repo = getRepository();
  const [projects, tasks, profiles, clients, , issues, approvals, payments] = await Promise.all([
    repo.listProjects(user.organizationId),
    repo.listTasks(user.organizationId),
    repo.listProfiles(user.organizationId),
    repo.listClients(user.organizationId),
    repo.listTopics(user.organizationId),
    repo.listIssues(user.organizationId, { status: ["open", "in_progress", "waiting"] }),
    repo.listApprovals(user.organizationId, { status: ["waiting_client"] }),
    repo.listPayments(user.organizationId),
  ]);
  const outstanding = payments.filter((p) => p.status === "sent" || p.status === "overdue").reduce((s, p) => s + p.amount, 0);

  const activeProjects = projects.filter((p) => p.status === "active" || p.status === "needs_attention");
  const counts = computeTaskCounts(tasks);
  const priorities = sortByPriorityAndDeadline(tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled")).slice(0, 6);
  const nextTopic = await repo.getNextTopic(user.organizationId);

  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const avgProgress = projects.length
    ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)
    : 0;

  const clientAvailabilities = await Promise.all(
    clients.map(async (c) => {
      const profile = profileMap.get(c.profile_id);
      const availability = profile ? await repo.getAvailability(profile.id) : null;
      return { client: c, profile, availability };
    })
  );

  return (
    <div>
      <PageHeader
        title={`${greeting(user.timezone)}, ${user.fullName.split(" ")[0]}`}
        subtitle="Here's what needs your attention today."
      />

      <div className="px-4 lg:px-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
          <SummaryCard label="Today's Tasks" value={counts.dueToday} icon={ListTodo} tone="info" href="/tasks?due=today" />
          <SummaryCard label="Overdue" value={counts.overdue} icon={AlarmClockOff} tone="danger" href="/tasks?due=overdue" />
          <SummaryCard
            label="Waiting for Client"
            value={counts.waitingForClient}
            icon={Hourglass}
            tone="warning"
            href="/tasks?waiting=client"
          />
          <SummaryCard
            label="Waiting for Me"
            value={counts.waitingForMe}
            icon={UserCheck}
            tone="info"
            href="/tasks?waiting=me"
          />
          <SummaryCard
            label="Client Availability"
            value={clientAvailabilities.filter((c) => c.availability?.status === "available").length}
            hint={`of ${clients.length} available now`}
            icon={Clock}
            tone="success"
            href="/availability"
          />
          <SummaryCard label="Avg. Progress" value={`${avgProgress}%`} icon={TrendingUp} tone="neutral" href="/projects" />
          <SummaryCard label="Outstanding" value={formatCurrency(outstanding)} icon={DollarSign} tone="warning" href="/payments" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Today&apos;s Priorities</h2>
              <Link href="/tasks" className="text-sm text-primary hover:underline">
                View all tasks
              </Link>
            </div>
            {priorities.length === 0 ? (
              <EmptyState icon={ListTodo} title="Nothing urgent right now" description="You're all caught up — nice work." />
            ) : (
              <div className="space-y-2.5">
                {priorities.map((task) => {
                  const project = projectMap.get(task.project_id);
                  const assignee = task.assignee_id ? profileMap.get(task.assignee_id) : null;
                  const waitingProfile = task.waiting_for_profile_id ? profileMap.get(task.waiting_for_profile_id) : null;
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      projectName={project?.name}
                      assigneeName={assignee?.full_name}
                      waitingForName={waitingProfile?.full_name}
                    />
                  );
                })}
              </div>
            )}

            <Card className="p-0">
              <CardHeader className="pt-5 pb-0 flex-row items-center justify-between">
                <CardTitle className="text-sm">Project Health</CardTitle>
                <Link href="/projects" className="text-xs text-primary hover:underline">
                  All projects
                </Link>
              </CardHeader>
              <CardContent className="pb-5 pt-4 space-y-3">
                {activeProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active projects.</p>
                ) : (
                  activeProjects.map((p) => (
                    <ProjectHealthRow key={p.id} projectId={p.id} name={p.name} status={p.status} progress={p.progress} />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <NextTopicCard
              topic={nextTopic}
              assigneeName={nextTopic?.assignee_id ? profileMap.get(nextTopic.assignee_id)?.full_name : null}
            />

            <Card className="p-0">
              <CardHeader className="pt-5 pb-0">
                <CardTitle className="text-sm">Client Availability</CardTitle>
              </CardHeader>
              <CardContent className="pb-5 pt-4 space-y-3">
                {clientAvailabilities.map(({ client, profile, availability }) => (
                  <div key={client.id} className="flex items-center gap-2.5">
                    <UserAvatar name={profile?.full_name ?? "?"} id={client.id} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{profile?.full_name}</div>
                      <AvailabilityBadge status={availability?.status ?? "away"} />
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2" asChild>
                      <Link href="/availability">Schedule</Link>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="p-0">
              <CardHeader className="pt-5 pb-0">
                <CardTitle className="text-sm">Needs Attention</CardTitle>
              </CardHeader>
              <CardContent className="pb-5 pt-4 space-y-2.5">
                {issues.length === 0 && approvals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No open issues or pending approvals.</p>
                ) : (
                  <>
                    {approvals.slice(0, 3).map((a) => (
                      <Link
                        key={a.id}
                        href={`/approvals/${a.id}`}
                        className="flex items-center justify-between gap-2 text-sm hover:underline"
                      >
                        <span className="truncate">{a.title}</span>
                        <Badge variant="warning">Awaiting client</Badge>
                      </Link>
                    ))}
                    {issues.slice(0, 3).map((i) => (
                      <Link
                        key={i.id}
                        href={`/issues/${i.id}`}
                        className="flex items-center justify-between gap-2 text-sm hover:underline"
                      >
                        <span className="truncate">{i.title}</span>
                        <Badge variant="danger">Issue</Badge>
                      </Link>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

async function ProjectHealthRow({
  projectId,
  name,
  status,
  progress,
}: {
  projectId: string;
  name: string;
  status: Parameters<typeof ProjectStatusBadge>[0]["status"];
  progress: number;
}) {
  const repo = getRepository();
  const health = await repo.getProjectHealth(projectId);
  const healthDot =
    health.health === "healthy" ? "bg-status-success" : health.health === "needs_attention" ? "bg-status-warning" : "bg-status-danger";

  return (
    <Link href={`/projects/${projectId}`} className="block group">
      <div className="flex items-center gap-3">
        <span className={`size-2 rounded-full shrink-0 ${healthDot}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium truncate group-hover:underline">{name}</span>
            <span className="text-xs text-muted-foreground shrink-0">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5 mt-1.5" />
        </div>
        <ProjectStatusBadge status={status} className="shrink-0 hidden sm:inline-flex" />
      </div>
      <p className="text-xs text-muted-foreground mt-1 ml-5">{health.reasons.join(" · ")}</p>
    </Link>
  );
}
