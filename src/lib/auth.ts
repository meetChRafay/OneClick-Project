import { redirect } from "next/navigation";
import { getRepository } from "@/lib/data";
import type { CurrentUser } from "@/lib/data/repository";

/** Returns the signed-in user, or null. Safe to call anywhere server-side. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const repo = getRepository();
  return repo.getCurrentUser();
}

/** Redirects to /login if nobody is signed in. Use at the top of protected pages/layouts. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Redirects non-admins to their dashboard. Use on admin-only pages. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}
