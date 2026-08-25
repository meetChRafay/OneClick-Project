import type { Metadata } from "next";
import { CheckSquare } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { getAccessibleProjectIds } from "@/lib/authz";
import { sortByPriorityAndDeadline } from "@/lib/domain-logic";
import { isDueThisWeek, isDueToday, isOverdue } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { TaskCard } from "@/components/task-card";
import { EmptyState } from "@/components/empty-state";
import { TaskFilters } from "@/components/tasks/task-filters";
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import type { Task, TaskStatus, WaitingFor } from "@/types/domain";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();
  const repo = getRepository();

  const scope = await getAccessibleProjectIds(repo, user);
  const [allProjects, allTasks, profiles] = await Promise.all([
    repo.listProjects(user.organizationId, user.role === "client" ? { profileId: user.id } : undefined),
    repo.listTasks(user.organizationId),
    repo.listProfiles(user.organizationId),
  ]);

  let tasks = allTasks.filter((t) => !scope || scope.has(t.project_id));

  if (params.project) tasks = tasks.filter((t) => t.project_id === params.project);
  if (params.status) tasks = tasks.filter((t) => t.status === (params.status as TaskStatus));
  if (params.waiting) tasks = tasks.filter((t) => t.waiting_for === (params.waiting as WaitingFor));
  if (params.assignee) tasks = tasks.filter((t) => t.assignee_id === params.assignee);
  if (params.priority) tasks = tasks.filter((t) => t.priority === params.priority);
  if (params.due === "today") tasks = tasks.filter((t) => isDueToday(t.deadline));
  if (params.due === "overdue") tasks = tasks.filter((t) => isOverdue(t.deadline));
  if (params.due === "week") tasks = tasks.filter((t) => isDueThisWeek(t.deadline));
  if (params.q) {
    const q = params.q.toLowerCase();
    tasks = tasks.filter((t) => t.title.toLowerCase().includes(q));
  }
  if (params.view !== "all") {
    tasks = tasks.filter((t: Task) => t.status !== "completed" && t.status !== "cancelled");
  }

  const sorted = sortByPriorityAndDeadline(tasks);
  const projectMap = new Map(allProjects.map((p) => [p.id, p]));
  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const admins = profiles.filter((p) => p.role === "admin");

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={`${sorted.length} task${sorted.length === 1 ? "" : "s"}`}
        actions={
          <NewTaskDialog
            projects={allProjects.map((p) => ({ id: p.id, name: p.name }))}
            members={admins.map((a) => ({ id: a.id, name: a.full_name }))}
          />
        }
      />
      <div className="px-4 lg:px-6 pb-10 space-y-4">
        <TaskFilters
          projects={allProjects.map((p) => ({ id: p.id, name: p.name }))}
          members={admins.map((a) => ({ id: a.id, name: a.full_name }))}
        />
        {sorted.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks match these filters"
            description="Try adjusting your filters, or create a new task to get started."
          />
        ) : (
          <div className="space-y-2.5">
            {sorted.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                projectName={projectMap.get(task.project_id)?.name}
                assigneeName={task.assignee_id ? profileMap.get(task.assignee_id)?.full_name : null}
                waitingForName={task.waiting_for_profile_id ? profileMap.get(task.waiting_for_profile_id)?.full_name : null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
