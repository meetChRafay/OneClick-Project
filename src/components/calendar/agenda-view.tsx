"use client";

import { format, isSameDay } from "date-fns";
import { CalendarX2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { cn, formatTime } from "@/lib/utils";
import { EVENT_TYPE_META } from "./event-meta";
import type { CalItem } from "./types";

export function AgendaView({
  items,
  onSelectItem,
}: {
  items: CalItem[];
  onSelectItem: (item: CalItem) => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyState icon={CalendarX2} title="Nothing scheduled" description="No events match these filters." />
    );
  }

  const sorted = [...items].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const groups: { day: Date; items: CalItem[] }[] = [];
  for (const item of sorted) {
    const day = new Date(item.start);
    const last = groups[groups.length - 1];
    if (last && isSameDay(last.day, day)) {
      last.items.push(item);
    } else {
      groups.push({ day, items: [item] });
    }
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.day.toISOString()}>
          <h3 className="text-xs font-medium text-muted-foreground mb-2 sticky top-0">
            {format(group.day, "EEEE, MMMM d, yyyy")}
          </h3>
          <div className="space-y-2">
            {group.items.map((item) => {
              const meta = EVENT_TYPE_META[item.type];
              const Icon = meta.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectItem(item)}
                  className="flex w-full items-center gap-3 rounded-xl border bg-card p-3.5 text-left hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className={cn("flex size-9 items-center justify-center rounded-lg shrink-0", meta.chip)}>
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={cn("text-sm font-medium truncate", item.completed && "line-through text-muted-foreground")}>
                      {item.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {item.allDay ? "All day" : formatTime(item.start)}
                      </span>
                      {item.projectName && (
                        <Badge variant="secondary" className="text-[10px]">{item.projectName}</Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{meta.label}</Badge>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
