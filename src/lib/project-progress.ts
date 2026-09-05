import type { Repository } from "@/lib/data/repository";

/**
 * Recomputes a project's progress % from its tasks: completed tasks ÷ all
 * tasks that count (everything except cancelled ones). Call this any time a
 * task is created, its status changes, or it's deleted, so the "Project
 * Progress" number on the dashboard and project page actually moves instead
 * of sitting at whatever it was set to when the project was created.
 */
export async function recalculateProjectProgress(repo: Repository, projectId: string) {
  const project = await repo.getProject(projectId);
  if (!project) return;

  const tasks = await repo.listTasks(project.organization_id, { projectId });
  const counted = tasks.filter((t) => t.status !== "cancelled");
  const completed = counted.filter((t) => t.status === "completed").length;
  const progress = counted.length ? Math.round((completed / counted.length) * 100) : 0;

  if (progress !== project.progress) {
    await repo.updateProject(projectId, { progress });
  }
}
