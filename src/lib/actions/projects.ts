"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";
import type { Priority, Project, ProjectStatus } from "@/types/domain";

export async function createProjectAction(input: {
  name: string;
  description?: string;
  clientId: string;
  priority?: Priority;
  deadline?: string | null;
  startDate?: string | null;
}) {
  const user = await requireAdmin();
  const repo = getRepository();
  const project = await repo.createProject({
    organization_id: user.organizationId,
    name: input.name,
    description: input.description ?? null,
    client_id: input.clientId,
    status: "planning",
    priority: input.priority ?? "medium",
    start_date: input.startDate ?? null,
    deadline: input.deadline ?? null,
    cover_color: ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"][Math.floor(Math.random() * 5)],
    drive_folder_id: null,
    drive_folder_url: null,
    created_by: user.id,
  });
  await repo.addProjectMember({ project_id: project.id, profile_id: user.id, role: "owner" });
  const client = await repo.getClient(input.clientId);
  if (client) {
    await repo.addProjectMember({ project_id: project.id, profile_id: client.profile_id, role: "client" });
  }
  await repo.logActivity({
    organization_id: user.organizationId,
    project_id: project.id,
    entity_type: "project",
    entity_id: project.id,
    actor_id: user.id,
    action: `created the project "${project.name}"`,
  });
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return project;
}

export async function updateProjectAction(id: string, patch: Partial<Project>) {
  const user = await requireAdmin();
  const repo = getRepository();
  const updated = await repo.updateProject(id, patch);
  if (patch.status) {
    await repo.logActivity({
      organization_id: user.organizationId,
      project_id: id,
      entity_type: "project",
      entity_id: id,
      actor_id: user.id,
      action: `changed project status to "${(patch.status as ProjectStatus).replace(/_/g, " ")}"`,
    });
  }
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
  return updated;
}
