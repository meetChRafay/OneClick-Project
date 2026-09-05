"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { requireAdmin, requireUser } from "@/lib/auth";
import { normalizeExternalUrl } from "@/lib/utils";
import type { Priority, TaskVersion, TaskVersionStatus, WaitingFor } from "@/types/domain";

export async function addTaskVersionAction(
  taskId: string,
  input: {
    status: TaskVersionStatus;
    priority: Priority;
    waitingFor: WaitingFor;
    deadline?: string | null;
    driveUrl?: string | null;
    notes?: string | null;
  }
) {
  const user = await requireAdmin();
  const repo = getRepository();
  const task = await repo.getTask(taskId);
  if (!task || task.organization_id !== user.organizationId) throw new Error("Task not found");

  const version = await repo.createTaskVersion({
    organization_id: user.organizationId,
    task_id: taskId,
    status: input.status,
    priority: input.priority,
    waiting_for: input.waitingFor,
    deadline: input.deadline ?? null,
    drive_url: normalizeExternalUrl(input.driveUrl ?? ""),
    notes: input.notes?.trim() || null,
    created_by: user.id,
  });

  await repo.logActivity({
    organization_id: user.organizationId,
    project_id: task.project_id,
    entity_type: "task",
    entity_id: taskId,
    actor_id: user.id,
    action: `added version ${version.version_number} (${input.status.replace(/_/g, " ")})`,
  });

  revalidatePath(`/tasks/${taskId}`);
  return version;
}

export async function updateTaskVersionAction(
  taskId: string,
  versionId: string,
  patch: Partial<
    Pick<TaskVersion, "status" | "priority" | "waiting_for" | "deadline" | "drive_url" | "notes">
  >
) {
  const user = await requireAdmin();
  const repo = getRepository();
  const task = await repo.getTask(taskId);
  if (!task || task.organization_id !== user.organizationId) throw new Error("Task not found");

  const cleaned = { ...patch };
  if (typeof cleaned.drive_url === "string") cleaned.drive_url = normalizeExternalUrl(cleaned.drive_url);

  const version = await repo.updateTaskVersion(versionId, cleaned);
  revalidatePath(`/tasks/${taskId}`);
  return version;
}

/**
 * Lets the CLIENT (not just admin) move a version to "Revision Requested"
 * or "Approved / Final" — this is the actual "request a revision" / "approve
 * this" button on their side, separate from just leaving a text comment.
 */
export async function setVersionStatusAsClientAction(
  taskId: string,
  versionId: string,
  status: Extract<TaskVersionStatus, "revision_requested" | "approved_final">
) {
  const user = await requireUser();
  if (status !== "revision_requested" && status !== "approved_final") {
    throw new Error("Not a valid client action");
  }
  const repo = getRepository();
  const task = await repo.getTask(taskId);
  if (!task || task.organization_id !== user.organizationId) throw new Error("Task not found");

  const version = await repo.updateTaskVersion(versionId, { status });

  await repo.logActivity({
    organization_id: user.organizationId,
    project_id: task.project_id,
    entity_type: "task",
    entity_id: taskId,
    actor_id: user.id,
    action: status === "approved_final" ? `approved version ${version.version_number}` : `requested a revision on version ${version.version_number}`,
  });

  if (task.assignee_id) {
    await repo.createNotification({
      organization_id: user.organizationId,
      profile_id: task.assignee_id,
      type: status === "approved_final" ? "approval_received" : "issue_created",
      title:
        status === "approved_final"
          ? `${user.fullName} approved version ${version.version_number} of "${task.title}"`
          : `${user.fullName} requested a revision on version ${version.version_number} of "${task.title}"`,
      link: `/tasks/${taskId}`,
      actor_id: user.id,
    });
  }

  revalidatePath(`/tasks/${taskId}`);
  return version;
}

export async function deleteTaskVersionAction(taskId: string, versionId: string) {
  const user = await requireAdmin();
  const repo = getRepository();
  const task = await repo.getTask(taskId);
  if (!task || task.organization_id !== user.organizationId) throw new Error("Task not found");

  await repo.deleteTaskVersion(versionId);
  revalidatePath(`/tasks/${taskId}`);
}
