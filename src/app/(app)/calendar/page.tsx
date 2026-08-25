import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { getAccessibleProjectIds } from "@/lib/authz";
import { PageHeader } from "@/components/page-header";
import { CalendarShell } from "@/components/calendar/calendar-shell";
import type { CalItem } from "@/components/calendar/types";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const user = await requireUser();
  const repo = getRepository();

  const scope = await getAccessibleProjectIds(repo, user);

  const [projects, allTasks, allEvents, profiles, integrations] = await Promise.all([
    repo.listProjects(user.organizationId, user.role === "client" ? { profileId: user.id } : undefined),
    repo.listTasks(user.organizationId),
    repo.listCalendarEvents(user.organizationId),
    repo.listProfiles(user.organizationId),
    repo.listIntegrations(user.organizationId),
  ]);

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));
  const profileMap = new Map(profiles.map((p) => [p.id, p.full_name]));
  const tasks = allTasks.filter((t) => !scope || scope.has(t.project_id));
  const events = allEvents.filter((e) => !e.project_id || !scope || scope.has(e.project_id));
  const calendarConnected = integrations.find((i) => i.provider === "google_calendar")?.connected;

  const items: CalItem[] = [];

  for (const event of events) {
    items.push({
      id: `event-${event.id}`,
      title: event.title,
      type: event.type,
      start: event.start,
      end: event.end,
      allDay: event.all_day,
      projectId: event.project_id ?? null,
      projectName: event.project_id ? projectMap.get(event.project_id) : undefined,
      location: event.location ?? null,
      attendeeNames: event.attendee_ids.map((id) => profileMap.get(id) ?? "Unknown"),
      href: event.project_id ? `/projects/${event.project_id}` : undefined,
    });
  }

  for (const task of tasks) {
    if (!task.deadline) continue;
    items.push({
      id: `task-${task.id}`,
      title: task.title,
      type: "task_deadline",
      start: task.deadline,
      end: task.deadline,
      allDay: true,
      projectId: task.project_id,
      projectName: projectMap.get(task.project_id),
      location: null,
      attendeeNames: task.assignee_id ? [profileMap.get(task.assignee_id) ?? "Unknown"] : [],
      href: `/tasks/${task.id}`,
      completed: task.status === "completed",
    });
  }

  items.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <div>
      <PageHeader title="Calendar" subtitle="Deadlines, meetings and milestones across your projects" />
      <div className="px-4 lg:px-6 pb-10">
        {user.role === "admin" && !calendarConnected && (
          <div className="rounded-lg border border-status-info/30 bg-status-info-bg px-4 py-3 text-sm text-status-info flex items-center justify-between gap-3 mb-4">
            <span>
              Connect Google Calendar to two-way sync meetings automatically. Once connected, clients only ever see
              your free/busy status — never the details of unrelated events.
            </span>
            <a href="/settings" className="font-medium hover:underline shrink-0">Connect in Settings</a>
          </div>
        )}
        <CalendarShell
          items={items}
          projects={projects.map((p) => ({ id: p.id, name: p.name }))}
          profiles={profiles.map((p) => ({ id: p.id, name: p.full_name }))}
          canCreate={user.role === "admin"}
        />
      </div>
    </div>
  );
}
