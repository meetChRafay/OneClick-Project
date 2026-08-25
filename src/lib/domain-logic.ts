import type { Availability, Task, TemporaryAvailability } from "@/types/domain";
import { isDueToday, isOverdue } from "@/lib/utils";

export function greeting(timezone?: string): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: timezone }).format(new Date())
  );
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function isActiveTask(task: Task) {
  return task.status !== "completed" && task.status !== "cancelled";
}

export interface TaskCounts {
  dueToday: number;
  overdue: number;
  waitingForClient: number;
  waitingForMe: number;
  completedThisWeek: number;
}

export function computeTaskCounts(tasks: Task[]): TaskCounts {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return {
    dueToday: tasks.filter((t) => isActiveTask(t) && isDueToday(t.deadline)).length,
    overdue: tasks.filter((t) => isActiveTask(t) && isOverdue(t.deadline)).length,
    waitingForClient: tasks.filter((t) => isActiveTask(t) && (t.waiting_for === "client" || t.waiting_for === "both"))
      .length,
    waitingForMe: tasks.filter((t) => isActiveTask(t) && (t.waiting_for === "me" || t.waiting_for === "both")).length,
    completedThisWeek: tasks.filter(
      (t) => t.status === "completed" && t.completed_at && new Date(t.completed_at).getTime() > weekAgo
    ).length,
  };
}

/**
 * Finds the next upcoming availability window from temporary slots + the
 * weekly recurring schedule, looking up to 14 days ahead. Returns a short
 * human label like "Today 18:00" or "Tomorrow 09:00" or "Friday 09:00".
 */
export function nextAvailableLabel(
  availability: Availability | null | undefined,
  temporary: TemporaryAvailability[]
): string | null {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const upcomingTemp = temporary
    .filter((t) => t.date > todayStr || (t.date === todayStr && toMinutes(t.end) > nowMinutes))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0];

  let scheduleMatch: { date: Date; start: string } | null = null;
  if (availability) {
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const day = d.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
      const config = availability.weekly_schedule.find((s) => s.day === day);
      if (config?.enabled && config.start) {
        if (i === 0 && toMinutes(config.start) <= nowMinutes) continue;
        scheduleMatch = { date: d, start: config.start };
        break;
      }
    }
  }

  const candidates: { date: string; start: string; label: () => string }[] = [];
  if (upcomingTemp) {
    candidates.push({
      date: upcomingTemp.date,
      start: upcomingTemp.start,
      label: () => `${dayLabel(new Date(upcomingTemp.date + "T00:00:00"))} ${upcomingTemp.start}`,
    });
  }
  if (scheduleMatch) {
    candidates.push({
      date: scheduleMatch.date.toISOString().slice(0, 10),
      start: scheduleMatch.start,
      label: () => `${dayLabel(scheduleMatch!.date)} ${scheduleMatch!.start}`,
    });
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  return candidates[0].label();
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function dayLabel(date: Date) {
  const now = new Date();
  const diffDays = Math.round((date.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
}

export function sortByPriorityAndDeadline(tasks: Task[]): Task[] {
  const priorityRank = { urgent: 0, high: 1, medium: 2, low: 3 };
  return [...tasks].sort((a, b) => {
    const overdueA = isOverdue(a.deadline) ? 0 : 1;
    const overdueB = isOverdue(b.deadline) ? 0 : 1;
    if (overdueA !== overdueB) return overdueA - overdueB;
    const pr = priorityRank[a.priority] - priorityRank[b.priority];
    if (pr !== 0) return pr;
    return (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999");
  });
}
