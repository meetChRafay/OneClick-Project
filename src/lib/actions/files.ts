"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { requireUser } from "@/lib/auth";
import type { FileCategory, Visibility } from "@/types/domain";

export async function createFileAction(input: {
  projectId: string;
  name: string;
  category: FileCategory;
  visibility?: Visibility;
  sizeBytes?: number;
  mimeType?: string;
}) {
  const user = await requireUser();
  const repo = getRepository();
  const file = await repo.createFile({
    organization_id: user.organizationId,
    project_id: input.projectId,
    name: input.name,
    category: input.category,
    visibility: input.visibility ?? "internal",
    size_bytes: input.sizeBytes ?? null,
    mime_type: input.mimeType ?? null,
    storage_path: `demo/${input.projectId}/${input.category}/${input.name}`,
    drive_file_id: null,
    drive_url: null,
    uploaded_by: user.id,
  });
  await repo.logActivity({
    organization_id: user.organizationId,
    project_id: input.projectId,
    entity_type: "file",
    entity_id: file.id,
    actor_id: user.id,
    action: `uploaded ${file.name}`,
  });
  revalidatePath("/files");
  revalidatePath(`/projects/${input.projectId}`);
  return file;
}

export async function deleteFileAction(id: string, projectId: string) {
  await requireUser();
  const repo = getRepository();
  await repo.deleteFile(id);
  revalidatePath("/files");
  revalidatePath(`/projects/${projectId}`);
}
