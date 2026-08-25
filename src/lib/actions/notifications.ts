"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";

export async function markNotificationReadAction(id: string) {
  const repo = getRepository();
  await repo.markNotificationRead(id);
  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction(profileId: string) {
  const repo = getRepository();
  await repo.markAllNotificationsRead(profileId);
  revalidatePath("/", "layout");
}
