import { notFound } from "next/navigation";
import Link from "next/link";
import { FolderKanban, CheckSquare } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { getAccessibleProjectIds, visibleToRole } from "@/lib/authz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge } from "@/components/priority-badge";
import { UserAvatar } from "@/components/user-avatar";
import { DeadlineIndicator } from "@/components/deadline-indicator";
import { IssueStatusSelect } from "@/components/issues/issue-status-select";
import { CommentThread } from "@/components/comment-thread";
import { addIssueCommentAction, deleteIssueAction } from "@/lib/actions/issues";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { formatDate } from "@/lib/utils";

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const repo = getRepository();

  const issue = await repo.getIssue(id);
  if (!issue || issue.organization_id !== user.organizationId) notFound();

  const scope = await getAccessibleProjectIds(repo, user);
  if (scope && !scope.has(issue.project_id)) notFound();

  const [project, task, profiles, comments] = await Promise.all([
    repo.getProject(issue.project_id),
    issue.task_id ? repo.getTask(issue.task_id) : Promise.resolve(null),
    repo.listProfiles(user.organizationId),
    repo.listIssueComments(id),
  ]);

  const profileMap = new Map(profiles.map((p) => [p.id, p.full_name]));
  const visibleComments = visibleToRole(comments, user.role);

  const boundAddComment = async (body: string, visibility: "internal" | "client_visible") => {
    "use server";
    await addIssueCommentAction(id, body, visibility);
  };

  return (
    <div className="px-4 lg:px-6 py-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/projects" className="hover:underline flex items-center gap-1">
          <FolderKanban className="size-3.5" />
          {project?.name}
        </Link>
        <span>/</span>
        <Link href="/issues" className="hover:underline">Issues</Link>
      </div>

      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{issue.title}</h1>
          {user.role === "admin" && (
            <ConfirmDeleteButton
              label="issue"
              itemName={issue.title}
              action={() => deleteIssueAction(issue.id)}
              redirectTo="/issues"
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <IssueStatusSelect issueId={issue.id} status={issue.status} editable={user.role === "admin"} />
          <PriorityBadge priority={issue.priority} />
          <DeadlineIndicator deadline={issue.deadline} completed={issue.status === "resolved" || issue.status === "closed"} />
        </div>
      </div>

      <Card className="p-0">
        <CardContent className="pt-5 pb-5 space-y-4">
          {issue.description ? (
            <p className="text-sm whitespace-pre-wrap">{issue.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No description provided.</p>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
            <div>
              <div className="text-xs text-muted-foreground">Reported by</div>
              <div className="flex items-center gap-1.5 mt-1">
                <UserAvatar name={profileMap.get(issue.reporter_id) ?? "?"} size="sm" />
                {profileMap.get(issue.reporter_id)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Assigned to</div>
              <div className="flex items-center gap-1.5 mt-1">
                {issue.assignee_id ? (
                  <>
                    <UserAvatar name={profileMap.get(issue.assignee_id) ?? "?"} size="sm" />
                    {profileMap.get(issue.assignee_id)}
                  </>
                ) : (
                  "Unassigned"
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Created</div>
              <div className="mt-1">{formatDate(issue.created_at, { month: "long", day: "numeric", year: "numeric" })}</div>
            </div>
            {task && (
              <div>
                <div className="text-xs text-muted-foreground">Related task</div>
                <Link href={`/tasks/${task.id}`} className="flex items-center gap-1.5 text-primary hover:underline mt-1">
                  <CheckSquare className="size-3.5" /> {task.title}
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardHeader className="pt-5 pb-0"><CardTitle className="text-sm">Comments</CardTitle></CardHeader>
        <CardContent className="pt-4 pb-5">
          <CommentThread
            comments={visibleComments}
            authorNames={profileMap}
            currentUserId={user.id}
            currentUserRole={user.role}
            onSubmit={boundAddComment}
          />
        </CardContent>
      </Card>
    </div>
  );
}
