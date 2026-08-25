import type { CurrentUser } from "@/lib/data/repository";
import type { Repository } from "@/lib/data/repository";

/**
 * Client-visibility scoping (spec sections 3, 41, 42): a client must never
 * see other clients' projects, or internal-only comments/files/notes.
 * Admins are unrestricted (`null` = "no filter needed").
 *
 * Every module page that lists tasks/issues/files/approvals/comments
 * should call this once and filter query results through it — see
 * src/app/(app)/tasks/page.tsx for the reference pattern.
 */
export async function getAccessibleProjectIds(repo: Repository, user: CurrentUser): Promise<Set<string> | null> {
  if (user.role === "admin") return null;
  const projects = await repo.listProjects(user.organizationId, { profileId: user.id });
  return new Set(projects.map((p) => p.id));
}

export function isProjectVisible(projectId: string, scope: Set<string> | null) {
  return scope === null || scope.has(projectId);
}

/** Filters out internal-only items (comments, files, notes) for clients. */
export function visibleToRole<T extends { visibility: "internal" | "client_visible" }>(
  items: T[],
  role: CurrentUser["role"]
): T[] {
  if (role === "admin") return items;
  return items.filter((i) => i.visibility === "client_visible");
}
