"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { requireUser } from "@/lib/auth";

export async function createApprovalAction(input: {
  projectId: string;
  taskId?: string | null;
  topicId?: string | null;
  fileId?: string | null;
  title: string;
}) {
  const user = await requireUser();
  const repo = getRepository();
  const approval = await repo.createApproval({
    organization_id: user.organizationId,
    project_id: input.projectId,
    task_id: input.taskId ?? null,
    topic_id: input.topicId ?? null,
    file_id: input.fileId ?? null,
    title: input.title,
    status: "waiting_client",
    requested_by: user.id,
    decided_by: null,
    feedback: null,
  });
  revalidatePath("/approvals");
  revalidatePath("/dashboard");
  return approval;
}

export async function decideApprovalAction(
  approvalId: string,
  decision: "approved" | "changes_requested",
  feedback?: string
) {
  const user = await requireUser();
  const repo = getRepository();
  const approval = await repo.decideApproval(approvalId, decision, user.id, feedback);

  await repo.logActivity({
    organization_id: user.organizationId,
    project_id: approval.project_id,
    entity_type: "approval",
    entity_id: approvalId,
    actor_id: user.id,
    action: decision === "approved" ? `approved "${approval.title}"` : `requested changes on "${approval.title}"`,
  });

  await repo.createNotification({
    organization_id: user.organizationId,
    profile_id: approval.requested_by,
    type: "approval_received",
    title: decision === "approved" ? `${approval.title} was approved` : `Changes requested: ${approval.title}`,
    body: feedback,
    link: `/approvals/${approvalId}`,
    actor_id: user.id,
  });

  revalidatePath("/approvals");
  revalidatePath(`/approvals/${approvalId}`);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return approval;
}
