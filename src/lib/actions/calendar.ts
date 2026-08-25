"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { requireUser } from "@/lib/auth";
import type { CalendarEventType } from "@/types/domain";

export async function createCalendarEventAction(input: {
  projectId?: string | null;
  title: string;
  type: CalendarEventType;
  start: string;
  end: string;
  allDay?: boolean;
  location?: string;
  attendeeIds?: string[];
}) {
  const user = await requireUser();
  const repo = getRepository();
  const event = await repo.createCalendarEvent({
    organization_id: user.organizationId,
    project_id: input.projectId ?? null,
    title: input.title,
    type: input.type,
    start: input.start,
    end: input.end,
    all_day: input.allDay ?? false,
    location: input.location ?? null,
    attendee_ids: input.attendeeIds ?? [],
    google_event_id: null,
    created_by: user.id,
  });
  revalidatePath("/calendar");
  return event;
}
