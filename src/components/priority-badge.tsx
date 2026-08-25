import { cn } from "@/lib/utils";
import type { Priority } from "@/types/domain";

const CONFIG: Record<Priority, { label: string; dot: string; text: string }> = {
  low: { label: "Low", dot: "bg-status-neutral", text: "text-muted-foreground" },
  medium: { label: "Medium", dot: "bg-status-info", text: "text-status-info" },
  high: { label: "High", dot: "bg-status-warning", text: "text-status-warning" },
  urgent: { label: "Urgent", dot: "bg-status-danger", text: "text-status-danger" },
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const cfg = CONFIG[priority];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", cfg.text, className)}>
      <span className={cn("size-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}
