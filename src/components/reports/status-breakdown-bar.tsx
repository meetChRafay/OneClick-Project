import { CheckCircle2, AlertTriangle, Clock, Circle, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_TONE_COLOR } from "@/lib/chart-colors";
import type { BreakdownSegment, StatusTone } from "@/lib/reports";

const TONE_ICON: Record<StatusTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  danger: AlertTriangle,
  warning: Clock,
  info: PlayCircle,
  neutral: Circle,
};

/**
 * A single 100%-width stacked bar for a part-to-whole status breakdown
 * (task pipeline, project health), plus an icon+label+count legend below.
 * Status colors are reserved for exactly this — never reused as a plain
 * categorical series — per the app's badge conventions in status-badge.tsx.
 */
export function StatusBreakdownBar({ segments }: { segments: BreakdownSegment[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  return (
    <div>
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-muted">
        {total === 0 ? (
          <div className="h-full w-full rounded-full bg-muted" />
        ) : (
          segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div
                key={s.key}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{ width: `${(s.value / total) * 100}%`, background: STATUS_TONE_COLOR[s.tone] }}
                title={`${s.label}: ${s.value}`}
              />
            ))
        )}
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {segments.map((s) => {
          const Icon = TONE_ICON[s.tone];
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <div key={s.key} className={cn("flex items-center gap-2 text-sm", s.value === 0 && "opacity-50")}>
              <Icon className="size-3.5 shrink-0" style={{ color: STATUS_TONE_COLOR[s.tone] }} />
              <span className="text-muted-foreground">{s.label}</span>
              <span className="ml-auto font-medium tabular-nums">{s.value}</span>
              <span className="text-xs text-muted-foreground tabular-nums w-9 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
