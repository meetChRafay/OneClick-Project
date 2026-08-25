import Link from "next/link";
import { CheckSquare, ClipboardCheck, CalendarClock, Clock, TrendingUp } from "lucide-react";
import { getRepository } from "@/lib/data";
import type { CurrentUser } from "@/lib/data/repository";
import { greeting } from "@/lib/domain-logic";
import { PageHeader } from "@/components/page-header";
import { SummaryCard } from "@/components/summary-card";
import { TaskCard } from "@/components/task-card";
import { NextTopicCard } from "@/components/next-topic-card";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AvailabilityBadge } from "@/components/availability-badge";
import { ApprovalStatusBadge } from "@/components/status-badge";
import { formatDateTime, relativeTime } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";

export async function ClientDashboard({ user }: { user: CurrentUser }) {
  const repo = getRepository();
  const [projects, tasks, approvals, availability, events, profiles] = await Promise.all([
    repo.listProjects(user.organizationId, { profileId: user.id }),
    repo.listTasks(user.organizationId),
    repo.listApprovals(user.organizationId, { status: ["waiting_client"] }),
    repo.getAvailability(user.id),
    repo.listCalendarEvents(user.organizationId, { from: new Date().toISOString() }),
    repo.listProfiles(user.organizationId),
  ]);

  const myProjectIds = new Set(projects.map((p) => p.id));

  // Privacy: only show activity from projects this client is a member of,
  // and never internal-only entries (spec section 41-42).
  const activityPerProject = await Promise.all(
    projects.map((p) => repo.listActivity(user.organizationId, { projectId: p.id, limit: 8 }))
  );
  const activity = activityPerProject
    .flat()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 8);
  const myTasks = tasks.filter(
    (t) => myProjectIds.has(t.project_id) && (t.waiting_for === "client" || t.waiting_for === "both") && t.status !== "completed"
  );
  const myApprovals = approvals.filter((a) => myProjectIds.has(a.project_id));
  const upcoming = events.filter((e) => myProjectIds.has(e.project_id ?? "")).slice(0, 4);
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const avgProgress = projects.length ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0;

  const nextTopic = projects.length ? await repo.getNextTopic(user.organizationId, projects[0].id) : null;

  return (
    <div>
      <PageHeader
        title={`${greeting(user.timezone)}, ${user.fullName.split(" ")[0]}`}
        subtitle="Here's your project update."
      />

      <div className="px-4 lg:px-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard label="My Tasks" value={myTasks.length} icon={CheckSquare} tone="info" href="/tasks" />
          <SummaryCard
            label="Awaiting My Approval"
            value={myApprovals.length}
            icon={ClipboardCheck}
            tone="warning"
            href="/approvals"
          />
          <SummaryCard label="Upcoming" value={upcoming.length} icon={CalendarClock} tone="neutral" href="/calendar" />
          <SummaryCard label="Project Progress" value={`${avgProgress}%`} icon={TrendingUp} tone="success" href="/projects" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Awaiting Your Approval</h2>
                <Link href="/approvals" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
              {myApprovals.length === 0 ? (
                <EmptyState icon={ClipboardCheck} title="Nothing to review" description="You're all caught up." />
              ) : (
                <div className="space-y-2.5">
                  {myApprovals.map((a) => (
                    <Card key={a.id} className="p-0">
                      <Link href={`/approvals/${a.id}`} className="flex items-center justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{a.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {projectMap.get(a.project_id)?.name} · requested {relativeTime(a.created_at)}
                          </div>
                        </div>
                        <ApprovalStatusBadge status={a.status} className="shrink-0" />
                      </Link>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">My Tasks</h2>
                <Link href="/tasks" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
              {myTasks.length === 0 ? (
                <EmptyState icon={CheckSquare} title="Nothing waiting on you" description="Great — nothing needs your input right now." />
              ) : (
                <div className="space-y-2.5">
                  {myTasks.map((task) => (
                    <TaskCard key={task.id} task={task} projectName={projectMap.get(task.project_id)?.name} />
                  ))}
                </div>
              )}
            </div>

            <Card className="p-0">
              <CardHeader className="pt-5 pb-0">
                <CardTitle className="text-sm">Recent Updates</CardTitle>
              </CardHeader>
              <CardContent className="pb-5 pt-4 space-y-3">
                {activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent activity yet.</p>
                ) : (
                  activity.map((a) => {
                    const actor = profileMap.get(a.actor_id);
                    return (
                      <div key={a.id} className="flex items-start gap-2.5 text-sm">
                        <UserAvatar name={actor?.full_name ?? "?"} size="sm" />
                        <div className="min-w-0">
                          <span className="font-medium">{actor?.full_name}</span>{" "}
                          <span className="text-muted-foreground">{a.action}</span>
                          <div className="text-xs text-muted-foreground">{relativeTime(a.created_at)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {projects[0] && (
              <Card className="p-0">
                <CardHeader className="pt-5 pb-0">
                  <CardTitle className="text-sm">{projects[0].name}</CardTitle>
                </CardHeader>
                <CardContent className="pb-5 pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{projects[0].progress}%</span>
                  </div>
                  <Progress value={projects[0].progress} className="h-2" />
                </CardContent>
              </Card>
            )}

            <NextTopicCard topic={nextTopic} />

            <Card className="p-0">
              <CardHeader className="pt-5 pb-0">
                <CardTitle className="text-sm">My Availability</CardTitle>
              </CardHeader>
              <CardContent className="pb-5 pt-4 space-y-3">
                <AvailabilityBadge status={availability?.status ?? "available"} message={availability?.status_message} />
                <Link href="/availability" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <Clock className="size-3.5" />
                  Update availability
                </Link>
              </CardContent>
            </Card>

            <Card className="p-0">
              <CardHeader className="pt-5 pb-0">
                <CardTitle className="text-sm">Upcoming</CardTitle>
              </CardHeader>
              <CardContent className="pb-5 pt-4 space-y-3">
                {upcoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing scheduled yet.</p>
                ) : (
                  upcoming.map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{e.title}</span>
                      <Badge variant="neutral" className="shrink-0">
                        {formatDateTime(e.start)}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
