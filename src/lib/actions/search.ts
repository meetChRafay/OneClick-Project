"use server";

import { getRepository } from "@/lib/data";
import { requireUser } from "@/lib/auth";

export async function globalSearchAction(query: string) {
  const user = await requireUser();
  const repo = getRepository();
  return repo.globalSearch(user.organizationId, query);
}
