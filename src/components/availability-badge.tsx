import { cn } from "@/lib/utils";
import type { AvailabilityStatusValue } from "@/types/domain";

const CONFIG: Record<AvailabilityStatusValue, { label: string; dot: string; text: string }> = {
  available: { label: "Available", dot: "bg-status-success", text: "text-status-success" },
  busy: { label: "Busy", dot: "bg-status-warning", text: "text-status-warning" },
  away: { label: "Away", dot: "bg-status-neutral", text: "text-muted-foreground" },
  dnd: { label: "Do Not Disturb", dot: "bg-status-danger", text: "text-status-danger" },
};

export function AvailabilityBadge({
  status,
  message,
  className,
}: {
  status: AvailabilityStatusValue;
  message?: string | null;
  className?: string;
}) {
  const cfg = CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", cfg.text, className)}>
      <span className={cn("size-2 rounded-full", cfg.dot)} />
      {message || cfg.label}
    </span>
  );
}

export function AvailabilityDot({ status, className }: { status: AvailabilityStatusValue; className?: string }) {
  const cfg = CONFIG[status];
  return <span className={cn("size-2.5 rounded-full ring-2 ring-card", cfg.dot, className)} />;
}
