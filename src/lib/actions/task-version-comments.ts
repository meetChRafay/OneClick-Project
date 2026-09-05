"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { requireUser } from "@/lib/auth";
import type { RevisionCategory } from "@/types/domain";

const CATEGORY_LABELS: Record<RevisionCategory, string> = {
  video_length: "video length",
  audio: "audio",
  visuals_color: "visuals/color",
  captions_text: "captions/text",
  thumbnail: "thumbnail",
  other: "other",
};

/**
 * Posts feedback on a specific version — either the admin or the client can
 * call this. Accepts a plain FormData so an optional image file can travel
 * alongside the text (see task-versions-panel.tsx for the client side).
 */
export async function addVersionCommentAction(formData: FormData) {
  const user = await requireUser();
  const repo = getRepository();

  const versionId = String(formData.get("versionId") ?? "");
  const taskId = String(formData.get("taskId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const categoryRaw = formData.get("category");
  const category = categoryRaw ? (String(categoryRaw) as RevisionCategory) : null;
  const file = formData.get("image");

  if (!versionId || !taskId) throw new Error("Missing version");

  const task = await repo.getTask(taskId);
  if (!task || task.organization_id !== user.organizationId) throw new Error("Task not found");

  let imageUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    const path = `${user.organizationId}/${versionId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    imageUrl = await repo.uploadImage(path, buffer, file.type || "image/png");
  }

  if (!body && !category && !imageUrl) throw new Error("Write feedback or attach an image first");

  const comment = await repo.addVersionComment({
    organization_id: user.organizationId,
    version_id: versionId,
    task_id: taskId,
    author_id: user.id,
    body: body || (category ? `Requested a ${CATEGORY_LABELS[category]} change` : "Attached an image"),
    category,
    image_url: imageUrl,
    visibility: "client_visible",
  });

  await repo.logActivity({
    organization_id: user.organizationId,
    project_id: task.project_id,
    entity_type: "task",
    entity_id: taskId,
    actor_id: user.id,
    action: "left feedback on a version",
  });

  if (user.role === "client" && task.assignee_id) {
    await repo.createNotification({
      organization_id: user.organizationId,
      profile_id: task.assignee_id,
      type: "new_comment",
      title: `${user.fullName} left feedback on a version of "${task.title}"`,
      body,
      link: `/tasks/${taskId}`,
      actor_id: user.id,
    });
  }

  revalidatePath(`/tasks/${taskId}`);
  return comment;
}
