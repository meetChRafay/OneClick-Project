"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";
import { normalizeExternalUrl } from "@/lib/utils";
import type { TaskVersionStatus } from "@/types/domain";

export async function addTaskVersionAction(
  taskId: string,
  input: { status: TaskVersionStatus; driveUrl?: string | null; notes?: string | null }
) {
  const user = await requireAdmin();
  const repo = getRepository();
  const task = await repo.getTask(taskId);
  if (!task || task.organization_id !== user.organizationId) throw new Error("Task not found");

  const version = await repo.createTaskVersion({
    organization_id: user.organizationId,
    task_id: taskId,
    status: input.status,
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

export async function updateTaskVersionStatusAction(
  taskId: string,
  versionId: string,
  status: TaskVersionStatus
) {
  const user = await requireAdmin();
  const repo = getRepository();
  const task = await repo.getTask(taskId);
  if (!task || task.organization_id !== user.organizationId) throw new Error("Task not found");

  const version = await repo.updateTaskVersionStatus(versionId, status);
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
