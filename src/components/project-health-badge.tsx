import { cn } from "@/lib/utils";
import type { ProjectHealthResult } from "@/types/domain";

const CONFIG: Record<ProjectHealthResult["health"], { label: string; emoji: string; className: string }> = {
  healthy: { label: "Healthy", emoji: "🟢", className: "bg-status-success-bg text-status-success" },
  needs_attention: { label: "Needs Attention", emoji: "🟡", className: "bg-status-warning-bg text-status-warning" },
  at_risk: { label: "At Risk", emoji: "🔴", className: "bg-status-danger-bg text-status-danger" },
};

export function ProjectHealthBadge({ health, className }: { health: ProjectHealthResult; className?: string }) {
  const cfg = CONFIG[health.health];
  return (
    <div className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg px-2.5 py-1.5 text-xs font-medium min-w-0", cfg.className, className)}>
      <span className="shrink-0">{cfg.emoji}</span>
      <span className="shrink-0">{cfg.label}</span>
      {health.reasons.length > 0 && (
        <span className="opacity-70 font-normal hidden sm:inline min-w-0">— {health.reasons.join(", ")}</span>
      )}
    </div>
  );
}
