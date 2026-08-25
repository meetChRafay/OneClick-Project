"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { requireUser } from "@/lib/auth";
import { detectMentionedProfileIds } from "@/lib/mentions";
import type { IssueStatus, Priority } from "@/types/domain";

export async function createIssueAction(input: {
  projectId: string;
  title: string;
  description?: string;
  priority?: Priority;
  assigneeId?: string | null;
  taskId?: string | null;
  deadline?: string | null;
}) {
  const user = await requireUser();
  const repo = getRepository();
  const issue = await repo.createIssue({
    organization_id: user.organizationId,
    project_id: input.projectId,
    task_id: input.taskId ?? null,
    title: input.title,
    description: input.description ?? null,
    priority: input.priority ?? "medium",
    status: "open",
    assignee_id: input.assigneeId ?? null,
    reporter_id: user.id,
    deadline: input.deadline ?? null,
    resolved_at: null,
  });
  await repo.logActivity({
    organization_id: user.organizationId,
    project_id: input.projectId,
    entity_type: "issue",
    entity_id: issue.id,
    actor_id: user.id,
    action: `opened issue "${issue.title}"`,
  });
  if (issue.assignee_id) {
    await repo.createNotification({
      organization_id: user.organizationId,
      profile_id: issue.assignee_id,
      type: "issue_created",
      title: `New issue: ${issue.title}`,
      body: issue.description,
      link: `/issues/${issue.id}`,
      actor_id: user.id,
    });
  }
  revalidatePath("/issues");
  revalidatePath("/dashboard");
  return issue;
}

export async function updateIssueStatusAction(issueId: string, status: IssueStatus) {
  const user = await requireUser();
  const repo = getRepository();
  const issue = await repo.getIssue(issueId);
  if (!issue) throw new Error("Issue not found");
  const updated = await repo.updateIssue(issueId, {
    status,
    resolved_at: status === "resolved" || status === "closed" ? new Date().toISOString() : issue.resolved_at,
  });
  await repo.logActivity({
    organization_id: user.organizationId,
    project_id: issue.project_id,
    entity_type: "issue",
    entity_id: issueId,
    actor_id: user.id,
    action: `changed issue status to "${status}"`,
  });
  revalidatePath("/issues");
  revalidatePath(`/issues/${issueId}`);
  revalidatePath("/dashboard");
  return updated;
}

export async function addIssueCommentAction(
  issueId: string,
  body: string,
  visibility: "internal" | "client_visible"
) {
  const user = await requireUser();
  const repo = getRepository();
  const issue = await repo.getIssue(issueId);
  if (!issue) throw new Error("Issue not found");
  const profiles = await repo.listProfiles(user.organizationId);
  const mentionedIds = detectMentionedProfileIds(body, profiles, user.id);
  const comment = await repo.addIssueComment({
    issue_id: issueId,
    author_id: user.id,
    body,
    visibility,
  });
  await repo.logActivity({
    organization_id: user.organizationId,
    project_id: issue.project_id,
    entity_type: "issue",
    entity_id: issueId,
    actor_id: user.id,
    action: "commented",
  });

  const notified = new Set<string>([user.id]);
  for (const id of mentionedIds) {
    if (notified.has(id)) continue;
    notified.add(id);
    await repo.createNotification({
      organization_id: user.organizationId,
      profile_id: id,
      type: "mention",
      title: `${user.fullName} mentioned you on "${issue.title}"`,
      body,
      link: `/issues/${issueId}`,
      actor_id: user.id,
    });
  }
  for (const otherParty of [issue.assignee_id, issue.reporter_id]) {
    if (!otherParty || notified.has(otherParty)) continue;
    notified.add(otherParty);
    await repo.createNotification({
      organization_id: user.organizationId,
      profile_id: otherParty,
      type: "new_comment",
      title: `${user.fullName} commented on "${issue.title}"`,
      body,
      link: `/issues/${issueId}`,
      actor_id: user.id,
    });
  }

  revalidatePath(`/issues/${issueId}`);
  revalidatePath("/communication");
  return comment;
}
