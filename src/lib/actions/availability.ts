"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { requireUser } from "@/lib/auth";
import type { Availability, AvailabilityStatusValue } from "@/types/domain";

export async function updateAvailabilityStatusAction(status: AvailabilityStatusValue, message?: string) {
  const user = await requireUser();
  const repo = getRepository();
  const existing = await repo.getAvailability(user.id);
  const record: Availability = existing
    ? { ...existing, status, status_message: message ?? null }
    : {
        // A real UUID, not a prefixed string like the old `avail_${user.id}`
        // — the `availability.id` column on Supabase is typed uuid, so that
        // prefixed value was rejected outright ("invalid input syntax for
        // type uuid") every time someone set their status for the first
        // time. profile_id (below) is the actual upsert conflict target, so
        // this id just needs to be a valid, unique value.
        id: randomUUID(),
        profile_id: user.id,
        status,
        status_message: message ?? null,
        timezone: user.timezone,
        weekly_schedule: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
          day: day as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          enabled: day !== 0 && day !== 6,
          start: "09:00",
          end: "18:00",
        })),
        updated_at: new Date().toISOString(),
      };
  const updated = await repo.upsertAvailability(record);
  revalidatePath("/availability");
  revalidatePath("/dashboard");
  return updated;
}

export async function updateWeeklyScheduleAction(schedule: Availability["weekly_schedule"], timezone: string) {
  const user = await requireUser();
  const repo = getRepository();
  const existing = await repo.getAvailability(user.id);
  const record: Availability = {
    id: existing?.id ?? randomUUID(),
    profile_id: user.id,
    status: existing?.status ?? "available",
    status_message: existing?.status_message ?? null,
    timezone,
    weekly_schedule: schedule,
    updated_at: new Date().toISOString(),
  };
  const updated = await repo.upsertAvailability(record);
  revalidatePath("/availability");
  return updated;
}

export async function addTemporaryAvailabilityAction(input: { date: string; start: string; end: string; note?: string }) {
  const user = await requireUser();
  const repo = getRepository();
  const record = await repo.addTemporaryAvailability({
    profile_id: user.id,
    date: input.date,
    start: input.start,
    end: input.end,
    note: input.note ?? null,
  });
  revalidatePath("/availability");
  revalidatePath("/dashboard");
  return record;
}

export async function createAvailabilityRequestAction(input: {
  projectId?: string | null;
  requestedOf: string;
  date: string;
  start: string;
  end: string;
  purpose: string;
}) {
  const user = await requireUser();
  const repo = getRepository();
  const request = await repo.createAvailabilityRequest({
    organization_id: user.organizationId,
    project_id: input.projectId ?? null,
    requested_by: user.id,
    requested_of: input.requestedOf,
    date: input.date,
    start: input.start,
    end: input.end,
    purpose: input.purpose,
    status: "pending",
    response_note: null,
    proposed_alternative: null,
  });
  await repo.createNotification({
    organization_id: user.organizationId,
    profile_id: input.requestedOf,
    type: "availability_request",
    title: "New availability request",
    body: `${input.purpose} — ${input.date} ${input.start}-${input.end}`,
    link: "/availability",
    actor_id: user.id,
  });
  revalidatePath("/availability");
  return request;
}

export async function respondAvailabilityRequestAction(
  id: string,
  status: "accepted" | "declined" | "rescheduled",
  note?: string,
  alternative?: { date: string; start: string; end: string }
) {
  const user = await requireUser();
  const repo = getRepository();
  const request = await repo.respondAvailabilityRequest(id, status, note, alternative);
  await repo.createNotification({
    organization_id: user.organizationId,
    profile_id: request.requested_by,
    type: "availability_request",
    title: `Availability request ${status}`,
    body: request.purpose,
    link: "/availability",
    actor_id: user.id,
  });
  revalidatePath("/availability");
  return request;
}
