import Link from "next/link";
import { CalendarDays, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { formatDate } from "@/lib/utils";
import type { Project, ProjectHealthResult } from "@/types/domain";

const COVER_GRADIENTS: Record<string, string> = {
  "chart-1": "from-chart-1/20 to-chart-1/5",
  "chart-2": "from-chart-2/20 to-chart-2/5",
  "chart-3": "from-chart-3/20 to-chart-3/5",
  "chart-4": "from-chart-4/20 to-chart-4/5",
  "chart-5": "from-chart-5/20 to-chart-5/5",
};

const HEALTH_DOT: Record<ProjectHealthResult["health"], string> = {
  healthy: "bg-status-success",
  needs_attention: "bg-status-warning",
  at_risk: "bg-status-danger",
};

export function ProjectCard({
  project,
  clientName,
  memberNames,
  health,
}: {
  project: Project;
  clientName?: string;
  memberNames?: string[];
  health?: ProjectHealthResult;
}) {
  const gradient = COVER_GRADIENTS[project.cover_color ?? "chart-1"] ?? COVER_GRADIENTS["chart-1"];

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="p-0 h-full overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
        <div className={`h-16 bg-gradient-to-br ${gradient} border-b`} />
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex items-start gap-1.5">
              {health && (
                <span
                  className={`mt-1.5 size-2 rounded-full shrink-0 ${HEALTH_DOT[health.health]}`}
                  title={`${health.health.replace(/_/g, " ")}${health.reasons.length ? " — " + health.reasons.join(", ") : ""}`}
                />
              )}
              <div className="min-w-0">
                <h3 className="font-medium text-sm truncate">{project.name}</h3>
                {clientName && <p className="text-xs text-muted-foreground truncate">{clientName}</p>}
              </div>
            </div>
            <ProjectStatusBadge status={project.status} className="shrink-0" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="font-medium text-foreground">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-1.5" />
          </div>

          <div className="flex items-center justify-between pt-1">
            <PriorityBadge priority={project.priority} />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {project.deadline && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3" />
                  {formatDate(project.deadline)}
                </span>
              )}
              {memberNames && memberNames.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="size-3" />
                  {memberNames.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
