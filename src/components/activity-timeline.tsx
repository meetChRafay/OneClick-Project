import { UserAvatar } from "@/components/user-avatar";
import { formatDate, formatTime } from "@/lib/utils";
import type { ActivityLog } from "@/types/domain";

export function ActivityTimeline({
  logs,
  actorNames,
}: {
  logs: ActivityLog[];
  actorNames: Map<string, string>;
}) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No activity yet.</p>;
  }

  // Group by day
  const groups = new Map<string, ActivityLog[]>();
  for (const log of logs) {
    const key = formatDate(log.created_at, { month: "long", day: "numeric", year: "numeric" });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(log);
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([day, entries]) => (
        <div key={day}>
          <h4 className="text-xs font-medium text-muted-foreground mb-3">{day}</h4>
          <div className="space-y-4 relative pl-1">
            <div className="absolute left-[15px] top-1 bottom-1 w-px bg-border" />
            {entries.map((log) => (
              <div key={log.id} className="flex items-start gap-3 relative">
                <UserAvatar name={actorNames.get(log.actor_id) ?? "?"} id={log.actor_id} size="sm" className="ring-4 ring-background" />
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm">
                    <span className="font-medium">{actorNames.get(log.actor_id) ?? "Someone"}</span>{" "}
                    <span className="text-muted-foreground">{log.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{formatTime(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
