"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { requireUser, requireAdmin } from "@/lib/auth";
import { detectMentionedProfileIds } from "@/lib/mentions";
import { recalculateProjectProgress } from "@/lib/project-progress";
import type { Priority, Task, TaskStatus, WaitingFor } from "@/types/domain";

export async function createTaskAction(input: {
  projectId: string;
  title: string;
  description?: string;
  assigneeId?: string | null;
  priority?: Priority;
  deadline?: string | null;
  waitingFor?: WaitingFor;
  topicId?: string | null;
}) {
  const user = await requireUser();
  const repo = getRepository();
  const task = await repo.createTask({
    organization_id: user.organizationId,
    project_id: input.projectId,
    topic_id: input.topicId ?? null,
    title: input.title,
    description: input.description ?? null,
    assignee_id: input.assigneeId ?? null,
    creator_id: user.id,
    status: "not_started",
    priority: input.priority ?? "medium",
    deadline: input.deadline ?? null,
    start_date: null,
    estimated_minutes: null,
    actual_minutes: null,
    waiting_for: input.waitingFor ?? "nobody",
    waiting_for_profile_id: null,
    completed_at: null,
  });
  await repo.logActivity({
    organization_id: user.organizationId,
    project_id: input.projectId,
    entity_type: "task",
    entity_id: task.id,
    actor_id: user.id,
    action: `created task "${task.title}"`,
  });
  await recalculateProjectProgress(repo, input.projectId);
  revalidatePath("/tasks");
  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath("/dashboard");
  return task;
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus) {
  const user = await requireUser();
  const repo = getRepository();
  const task = await repo.getTask(taskId);
  if (!task) throw new Error("Task not found");

  const patch: Partial<Task> = { status };
  if (status === "completed") {
    patch.completed_at = new Date().toISOString();
    patch.waiting_for = "nobody";
  }
  const updated = await repo.updateTask(taskId, patch);
  await repo.logActivity({
    organization_id: user.organizationId,
    project_id: task.project_id,
    entity_type: "task",
    entity_id: taskId,
    actor_id: user.id,
    action: `changed status to "${status.replace(/_/g, " ")}"`,
  });
  await recalculateProjectProgress(repo, task.project_id);
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath(`/projects/${task.project_id}`);
  revalidatePath("/dashboard");
  return updated;
}

export async function updateTaskAction(taskId: string, patch: Partial<Task>) {
  await requireUser();
  const repo = getRepository();
  const task = await repo.getTask(taskId);
  if (!task) throw new Error("Task not found");
  const updated = await repo.updateTask(taskId, patch);
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath(`/projects/${task.project_id}`);
  revalidatePath("/dashboard");
  return updated;
}

export async function deleteTaskAction(taskId: string) {
  const user = await requireAdmin();
  const repo = getRepository();
  const task = await repo.getTask(taskId);
  if (!task || task.organization_id !== user.organizationId) throw new Error("Task not found");
  await repo.deleteTask(taskId);
  await recalculateProjectProgress(repo, task.project_id);
  revalidatePath("/tasks");
  revalidatePath(`/projects/${task.project_id}`);
  revalidatePath("/dashboard");
  return task.project_id;
}

export async function addTaskCommentAction(
  taskId: string,
  body: string,
  visibility: "internal" | "client_visible"
) {
  const user = await requireUser();
  const repo = getRepository();
  const task = await repo.getTask(taskId);
  if (!task) throw new Error("Task not found");
  const profiles = await repo.listProfiles(user.organizationId);
  const mentionedIds = detectMentionedProfileIds(body, profiles, user.id);
  const comment = await repo.addTaskComment({
    task_id: taskId,
    author_id: user.id,
    body,
    visibility,
    mentioned_profile_ids: mentionedIds,
  });
  await repo.logActivity({
    organization_id: user.organizationId,
    project_id: task.project_id,
    entity_type: "task",
    entity_id: taskId,
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
      title: `${user.fullName} mentioned you on "${task.title}"`,
      body,
      link: `/tasks/${taskId}`,
      actor_id: user.id,
    });
  }
  const otherParty = task.assignee_id;
  if (otherParty && !notified.has(otherParty)) {
    notified.add(otherParty);
    await repo.createNotification({
      organization_id: user.organizationId,
      profile_id: otherParty,
      type: "new_comment",
      title: `${user.fullName} commented on "${task.title}"`,
      body,
      link: `/tasks/${taskId}`,
      actor_id: user.id,
    });
  }

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/communication");
  return comment;
}
