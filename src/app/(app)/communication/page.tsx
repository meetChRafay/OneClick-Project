import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { getAccessibleProjectIds, visibleToRole } from "@/lib/authz";
import { detectMentionedProfileIds } from "@/lib/mentions";
import { PageHeader } from "@/components/page-header";
import { CommunicationFeed, type CommunicationItem } from "@/components/communication/communication-feed";
import type { Task, Issue, Approval } from "@/types/domain";

export const metadata: Metadata = { title: "Communication" };

export default async function CommunicationPage() {
  const user = await requireUser();
  const repo = getRepository();

  const scope = await getAccessibleProjectIds(repo, user);

  const [projects, allTasks, allIssues, allApprovals, profiles, notifications] = await Promise.all([
    repo.listProjects(user.organizationId, user.role === "client" ? { profileId: user.id } : undefined),
    repo.listTasks(user.organizationId),
    repo.listIssues(user.organizationId),
    repo.listApprovals(user.organizationId),
    repo.listProfiles(user.organizationId),
    repo.listNotifications(user.id),
  ]);

  const tasks: Task[] = allTasks.filter((t) => !scope || scope.has(t.project_id));
  const issues: Issue[] = allIssues.filter((i) => !scope || scope.has(i.project_id));
  const approvals: Approval[] = allApprovals.filter((a) => !scope || scope.has(a.project_id));

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));
  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const unreadLinks = new Set(notifications.filter((n) => !n.read && n.link).map((n) => n.link as string));

  const [taskCommentLists, issueCommentLists] = await Promise.all([
    Promise.all(tasks.map((t) => repo.listTaskComments(t.id))),
    Promise.all(issues.map((i) => repo.listIssueComments(i.id))),
  ]);

  const items: CommunicationItem[] = [];

  tasks.forEach((task, idx) => {
    const comments = visibleToRole(taskCommentLists[idx], user.role);
    for (const c of comments) {
      const author = profileMap.get(c.author_id);
      const href = `/tasks/${task.id}`;
      items.push({
        id: `task-comment-${c.id}`,
        source: "task",
        sourceTitle: task.title,
        projectId: task.project_id,
        projectName: projectMap.get(task.project_id) ?? "Unknown project",
        authorId: c.author_id,
        authorName: author?.full_name ?? "Unknown",
        authorRole: author?.role ?? "admin",
        body: c.body,
        visibility: c.visibility,
        createdAt: c.created_at,
        mentionedIds: c.mentioned_profile_ids,
        unread: unreadLinks.has(href),
        href,
      });
    }
  });

  issues.forEach((issue, idx) => {
    const comments = visibleToRole(issueCommentLists[idx], user.role);
    for (const c of comments) {
      const author = profileMap.get(c.author_id);
      const href = `/issues/${issue.id}`;
      items.push({
        id: `issue-comment-${c.id}`,
        source: "issue",
        sourceTitle: issue.title,
        projectId: issue.project_id,
        projectName: projectMap.get(issue.project_id) ?? "Unknown project",
        authorId: c.author_id,
        authorName: author?.full_name ?? "Unknown",
        authorRole: author?.role ?? "admin",
        body: c.body,
        visibility: c.visibility,
        createdAt: c.created_at,
        mentionedIds: detectMentionedProfileIds(c.body, profiles, c.author_id),
        unread: unreadLinks.has(href),
        href,
      });
    }
  });

  for (const approval of approvals) {
    if (!approval.feedback || !approval.decided_by || !approval.decided_at) continue;
    const author = profileMap.get(approval.decided_by);
    const href = `/approvals/${approval.id}`;
    items.push({
      id: `approval-feedback-${approval.id}`,
      source: "approval",
      sourceTitle: approval.title,
      projectId: approval.project_id,
      projectName: projectMap.get(approval.project_id) ?? "Unknown project",
      authorId: approval.decided_by,
      authorName: author?.full_name ?? "Unknown",
      authorRole: author?.role ?? "admin",
      body: approval.feedback,
      // Approval feedback is always part of the client-facing decision.
      visibility: "client_visible",
      createdAt: approval.decided_at,
      mentionedIds: [],
      unread: unreadLinks.has(href),
      href,
    });
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <PageHeader
        title="Communication"
        subtitle={`${items.length} message${items.length === 1 ? "" : "s"} across your projects`}
      />
      <div className="px-4 lg:px-6 pb-10">
        <CommunicationFeed
          items={items}
          currentUserId={user.id}
          projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        />
      </div>
    </div>
  );
}
