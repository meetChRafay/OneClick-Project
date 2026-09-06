import { notFound } from "next/navigation";
import Link from "next/link";
import { FolderKanban, Sparkles, Paperclip } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { getAccessibleProjectIds, visibleToRole } from "@/lib/authz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TaskDetailEditor } from "@/components/tasks/task-detail-editor";
import { TaskVersionsPanel } from "@/components/tasks/task-versions-panel";
import { CommentThread } from "@/components/comment-thread";
import { ActivityTimeline } from "@/components/activity-timeline";
import { FileCard } from "@/components/file-card";
import { addTaskCommentAction, deleteTaskAction } from "@/lib/actions/tasks";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { formatDate } from "@/lib/utils";

// Force a fresh Postgres read on every visit — belt-and-suspenders against
// any edge/CDN caching ever serving a stale task page (e.g. a client
// looking at a page that was loaded just before a new version was added).
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const repo = getRepository();

  const task = await repo.getTask(id);
  if (!task || task.organization_id !== user.organizationId) notFound();

  const scope = await getAccessibleProjectIds(repo, user);
  if (scope && !scope.has(task.project_id)) notFound();

  const [project, profiles, comments, versions, activity, topic, allFiles] = await Promise.all([
    repo.getProject(task.project_id),
    repo.listProfiles(user.organizationId),
    repo.listTaskComments(id),
    repo.listTaskVersions(id),
    repo.listActivity(user.organizationId, { entityId: id }),
    task.topic_id ? repo.getTopic(task.topic_id) : Promise.resolve(null),
    repo.listFiles(user.organizationId, { projectId: task.project_id }),
  ]);

  const versionCommentLists = await Promise.all(versions.map((v) => repo.listVersionComments(v.id)));
  const commentsByVersion = new Map(versions.map((v, i) => [v.id, versionCommentLists[i]]));

  const admins = profiles.filter((p) => p.role === "admin");
  const profileMap = new Map(profiles.map((p) => [p.id, p.full_name]));
  const visibleComments = visibleToRole(comments, user.role);
  const attachments = visibleToRole(allFiles, user.role).slice(0, 3);

  const boundAddComment = async (body: string, visibility: "internal" | "client_visible") => {
    "use server";
    await addTaskCommentAction(id, body, visibility);
  };

  const boundDeleteTask = async () => {
    "use server";
    await deleteTaskAction(id);
  };

  return (
    <div className="px-4 lg:px-6 py-6 max-w-6xl">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
        <Link href="/projects" className="hover:underline flex items-center gap-1"><FolderKanban className="size-3.5" />{project?.name}</Link>
        <span>/</span>
        <Link href="/tasks" className="hover:underline">Tasks</Link>
      </div>

      <div className="flex items-start justify-between gap-3 mb-1">
        <h1 className="text-xl font-semibold tracking-tight">{task.title}</h1>
        {user.role === "admin" && (
          <ConfirmDeleteButton
            label="task"
            itemName={task.title}
            action={boundDeleteTask}
            redirectTo="/tasks"
          />
        )}
      </div>
      {topic && (
        <Link href="/topics" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-4">
          <Sparkles className="size-3.5" /> {topic.title}
        </Link>
      )}

      <div className="grid lg:grid-cols-5 gap-6 mt-4">
        <div className="lg:col-span-3 space-y-5">
          {/* Versions comes first, right under the title — this is where the
              status badge and the client's Approve / Request Revision buttons
              live, and it was easy to miss further down the page. Putting it
              first means it's the very first thing anyone sees on this task,
              no scrolling required. */}
          <Card className="p-0">
            <CardHeader className="pt-5 pb-0"><CardTitle className="text-sm">Versions</CardTitle></CardHeader>
            <CardContent className="pt-4 pb-5">
              <TaskVersionsPanel
                taskId={id}
                versions={versions}
                commentsByVersion={commentsByVersion}
                authorNames={profileMap}
                canManage={user.role === "admin"}
              />
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardHeader className="pt-5 pb-0"><CardTitle className="text-sm">Task details</CardTitle></CardHeader>
            <CardContent className="pt-4 pb-5 space-y-5">
              {task.description ? (
                <p className="text-sm whitespace-pre-wrap">{task.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No description provided.</p>
              )}
              {/* Both admin and client can edit these fields — the server already
                  allows it (see tasks_update in 0002_rls_policies.sql, which has
                  no admin-only check), so this is purely opening up the UI to
                  match: the client should be able to update status/priority/
                  waiting-for/deadline/drive-link on their own tasks too. */}
              <TaskDetailEditor task={task} members={admins.map((a) => ({ id: a.id, name: a.full_name }))} editable={true} />
            </CardContent>
          </Card>

          {attachments.length > 0 && (
            <Card className="p-0">
              <CardHeader className="pt-5 pb-0">
                <CardTitle className="text-sm flex items-center gap-1.5"><Paperclip className="size-3.5" />Related files</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 pb-5 space-y-2.5">
                {attachments.map((f) => (
                  <FileCard key={f.id} file={f} />
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="p-0">
            <CardHeader className="pt-5 pb-0"><CardTitle className="text-sm">Details</CardTitle></CardHeader>
            <CardContent className="pt-4 pb-5 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Creator</div>
                <div className="mt-0.5">{profileMap.get(task.creator_id) ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Start date</div>
                <div className="mt-0.5">{task.start_date ? formatDate(task.start_date) : "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Estimated time</div>
                <div className="mt-0.5">{task.estimated_minutes ? `${Math.round(task.estimated_minutes / 60)}h` : "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Actual time</div>
                <div className="mt-0.5">{task.actual_minutes ? `${Math.round(task.actual_minutes / 60)}h` : "—"}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="comments">
            <TabsList>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="comments">
              <Card className="p-0">
                <CardContent className="pt-5 pb-5">
                  <CommentThread
                    comments={visibleComments}
                    authorNames={profileMap}
                    currentUserId={user.id}
                    currentUserRole={user.role}
                    onSubmit={boundAddComment}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="activity">
              <Card className="p-0">
                <CardContent className="pt-5 pb-5">
                  <ActivityTimeline logs={activity} actorNames={profileMap} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
