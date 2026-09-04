import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays, ExternalLink, FolderOpen, Sparkles, AlertTriangle, ClipboardCheck, DollarSign } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { getAccessibleProjectIds, visibleToRole } from "@/lib/authz";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { ProjectHealthBadge } from "@/components/project-health-badge";
import { UserAvatar } from "@/components/user-avatar";
import { TaskCard } from "@/components/task-card";
import { TopicRow } from "@/components/topics/topic-row";
import { IssueCard } from "@/components/issue-card";
import { FileCard } from "@/components/file-card";
import { ApprovalCard } from "@/components/approval-card";
import { ActivityTimeline } from "@/components/activity-timeline";
import { EmptyState } from "@/components/empty-state";
import { PaymentTable } from "@/components/payments/payment-table";
import { NewPaymentDialog } from "@/components/payments/new-payment-dialog";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteProjectAction } from "@/lib/actions/projects";
import { formatCurrency, formatDate } from "@/lib/utils";
import { sortByPriorityAndDeadline } from "@/lib/domain-logic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const repo = getRepository();

  const scope = await getAccessibleProjectIds(repo, user);
  if (scope && !scope.has(id)) notFound();

  const project = await repo.getProject(id);
  if (!project || project.organization_id !== user.organizationId) notFound();

  const [client, members, profiles, tasks, topics, issues, files, approvals, activity, health, settings, allPayments] = await Promise.all([
    repo.getClient(project.client_id),
    repo.listProjectMembers(id),
    repo.listProfiles(user.organizationId),
    repo.listTasks(user.organizationId, { projectId: id }),
    repo.listTopics(user.organizationId, { projectId: id }),
    repo.listIssues(user.organizationId, { projectId: id }),
    repo.listFiles(user.organizationId, { projectId: id }),
    repo.listApprovals(user.organizationId, { projectId: id }),
    repo.listActivity(user.organizationId, { projectId: id, limit: 30 }),
    repo.getProjectHealth(id),
    repo.getProjectSettings(id),
    repo.listPayments(user.organizationId, { projectId: id }),
  ]);

  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const clientProfile = client ? profileMap.get(client.profile_id) : null;
  const visibleFiles = visibleToRole(files, user.role);
  const activeTasks = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const openIssues = issues.filter((i) => i.status !== "resolved" && i.status !== "closed");
  const payments = user.role === "client" ? allPayments.filter((p) => p.status !== "draft") : allPayments;
  const outstanding = payments.filter((p) => p.status === "sent" || p.status === "overdue").reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="px-4 lg:px-6 pt-6 pb-4 border-b">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
            </div>
            <p className="text-sm text-muted-foreground">
              {clientProfile?.full_name ?? client?.company_name} · {client?.company_name}
            </p>
            {project.description && <p className="text-sm text-muted-foreground max-w-2xl">{project.description}</p>}
            <ProjectHealthBadge health={health} />
          </div>

          <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
            <div className="flex items-center -space-x-2">
              {members.map((m) => {
                const profile = profileMap.get(m.profile_id);
                if (!profile) return null;
                return <UserAvatar key={m.id} name={profile.full_name} id={profile.id} className="ring-2 ring-background" />;
              })}
            </div>
            {project.deadline && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="size-3.5" />
                Deadline {formatDate(project.deadline, { month: "long", day: "numeric", year: "numeric" })}
              </div>
            )}
            <div className="w-40">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-1.5" />
            </div>
            {user.role === "admin" && (
              <ConfirmDeleteButton
                label="project"
                itemName={project.name}
                warning="Its tasks, issues, files, topics, and approvals will be deleted too."
                action={() => deleteProjectAction(project.id)}
                redirectTo="/projects"
              />
            )}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-5">
        <Tabs defaultValue="overview">
          <TabsList className="mb-5 flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({activeTasks.length})</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
            <TabsTrigger value="issues">Issues ({openIssues.length})</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
            <TabsTrigger value="billing">Billing{outstanding > 0 ? ` (${formatCurrency(outstanding)} due)` : ""}</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-5">
            <div className="grid lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-5">
                <Card className="p-0">
                  <CardHeader className="pt-5 pb-0 flex-row items-center justify-between">
                    <CardTitle className="text-sm">Priority Tasks</CardTitle>
                    <Link href={`/tasks?project=${id}`} className="text-xs text-primary hover:underline">View all</Link>
                  </CardHeader>
                  <CardContent className="pt-4 pb-5 space-y-2.5">
                    {activeTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No open tasks.</p>
                    ) : (
                      sortByPriorityAndDeadline(activeTasks).slice(0, 4).map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          assigneeName={task.assignee_id ? profileMap.get(task.assignee_id)?.full_name : null}
                          waitingForName={task.waiting_for_profile_id ? profileMap.get(task.waiting_for_profile_id)?.full_name : null}
                          compact
                        />
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="p-0">
                  <CardHeader className="pt-5 pb-0">
                    <CardTitle className="text-sm">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 pb-5">
                    <ActivityTimeline
                      logs={activity.slice(0, 6)}
                      actorNames={new Map(profiles.map((p) => [p.id, p.full_name]))}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-5">
                <Card className="p-0">
                  <CardHeader className="pt-5 pb-0">
                    <CardTitle className="text-sm flex items-center gap-1.5"><Sparkles className="size-3.5 text-primary" />Topics in progress</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 pb-5 space-y-2">
                    {topics.filter((t) => t.status !== "published").slice(0, 4).map((t) => (
                      <Link key={t.id} href="/topics" className="block text-sm hover:underline truncate">{t.title}</Link>
                    ))}
                    {topics.length === 0 && <p className="text-sm text-muted-foreground">No topics yet.</p>}
                  </CardContent>
                </Card>

                <Card className="p-0">
                  <CardHeader className="pt-5 pb-0">
                    <CardTitle className="text-sm flex items-center gap-1.5"><ClipboardCheck className="size-3.5 text-primary" />Pending approvals</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 pb-5 space-y-2">
                    {approvals.filter((a) => a.status === "waiting_client").length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nothing pending.</p>
                    ) : (
                      approvals.filter((a) => a.status === "waiting_client").map((a) => (
                        <Link key={a.id} href={`/approvals/${a.id}`} className="block text-sm hover:underline truncate">{a.title}</Link>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="p-0">
                  <CardHeader className="pt-5 pb-0">
                    <CardTitle className="text-sm flex items-center gap-1.5"><AlertTriangle className="size-3.5 text-primary" />Open issues</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 pb-5 space-y-2">
                    {openIssues.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No open issues.</p>
                    ) : (
                      openIssues.map((i) => (
                        <Link key={i.id} href={`/issues/${i.id}`} className="block text-sm hover:underline truncate">{i.title}</Link>
                      ))
                    )}
                  </CardContent>
                </Card>

                {user.role === "admin" && (
                  <Card className="p-0">
                    <CardHeader className="pt-5 pb-0">
                      <CardTitle className="text-sm flex items-center gap-1.5"><FolderOpen className="size-3.5 text-primary" />Google Drive</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 pb-5">
                      {project.drive_folder_url ? (
                        <a href={project.drive_folder_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1.5">
                          Open in Google Drive <ExternalLink className="size-3.5" />
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Not connected yet. {settings?.drive_structure_created ? "" : "Connect Drive in Settings to auto-create this project's folder structure."}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-2.5">
            {tasks.length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="No tasks yet" description="Create your first task to start tracking this project." />
            ) : (
              sortByPriorityAndDeadline(tasks).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  assigneeName={task.assignee_id ? profileMap.get(task.assignee_id)?.full_name : null}
                  waitingForName={task.waiting_for_profile_id ? profileMap.get(task.waiting_for_profile_id)?.full_name : null}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="topics" className="space-y-2">
            {topics.length === 0 ? (
              <EmptyState icon={Sparkles} title="No topics yet" description="Add your first content topic to start the pipeline." />
            ) : (
              topics.map((t) => (
                <TopicRow key={t.id} topic={t} assigneeName={t.assignee_id ? profileMap.get(t.assignee_id)?.full_name : null} />
              ))
            )}
          </TabsContent>

          <TabsContent value="files" className="grid sm:grid-cols-2 gap-2.5">
            {visibleFiles.length === 0 ? (
              <EmptyState icon={FolderOpen} title="No files uploaded yet" description="Upload your first project file." className="sm:col-span-2" />
            ) : (
              visibleFiles.map((f) => (
                <FileCard key={f.id} file={f} uploaderName={profileMap.get(f.uploaded_by)?.full_name} canDelete={user.role === "admin"} />
              ))
            )}
          </TabsContent>

          <TabsContent value="communication">
            <ProjectCommunicationTab projectId={id} tasks={tasks} issues={issues} profileMap={profileMap} />
          </TabsContent>

          <TabsContent value="issues" className="space-y-2.5">
            {issues.length === 0 ? (
              <EmptyState icon={AlertTriangle} title="No issues reported" description="Nice — nothing blocking this project." />
            ) : (
              issues.map((i) => (
                <IssueCard key={i.id} issue={i} assigneeName={i.assignee_id ? profileMap.get(i.assignee_id)?.full_name : null} />
              ))
            )}
          </TabsContent>

          <TabsContent value="approvals" className="space-y-2.5">
            {approvals.length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="No approvals yet" description="Request an approval once you have a version ready for review." />
            ) : (
              approvals.map((a) => (
                <ApprovalCard
                  key={a.id}
                  approval={a}
                  canDecide={user.role === "client" && a.status === "waiting_client"}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="billing" className="space-y-3">
            {user.role === "admin" && (
              <div className="flex justify-end">
                <NewPaymentDialog projects={[{ id: project.id, name: project.name, clientId: project.client_id }]} />
              </div>
            )}
            {payments.length === 0 ? (
              <EmptyState icon={DollarSign} title="No invoices yet" description="Create the first invoice for this project." />
            ) : (
              <PaymentTable payments={payments} showProject={false} editable={user.role === "admin"} />
            )}
          </TabsContent>

          <TabsContent value="activity">
            <ActivityTimeline logs={activity} actorNames={new Map(profiles.map((p) => [p.id, p.full_name]))} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ProjectCommunicationTab({
  tasks,
  issues,
}: {
  projectId: string;
  tasks: { id: string; title: string }[];
  issues: { id: string; title: string }[];
  profileMap: Map<string, { full_name: string }>;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-3">
        All comments across this project&apos;s tasks and issues — open any thread to reply.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Task threads</h4>
          <div className="space-y-1.5">
            {tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
            {tasks.map((t) => (
              <Link key={t.id} href={`/tasks/${t.id}`} className="block text-sm hover:underline truncate">
                {t.title}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Issue threads</h4>
          <div className="space-y-1.5">
            {issues.length === 0 && <p className="text-sm text-muted-foreground">No issues yet.</p>}
            {issues.map((i) => (
              <Link key={i.id} href={`/issues/${i.id}`} className="block text-sm hover:underline truncate">
                {i.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
