import type { CalendarEventType } from "@/types/domain";

export type CalItemType = CalendarEventType | "task_deadline";

export interface CalItem {
  id: string;
  title: string;
  type: CalItemType;
  start: string;
  end: string;
  allDay: boolean;
  projectId?: string | null;
  projectName?: string;
  location?: string | null;
  attendeeNames: string[];
  href?: string;
  completed?: boolean;
}
