"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from "date-fns";
import { cn } from "@/lib/utils";
import { EventPill } from "./event-pill";
import { DAY_LABELS_SHORT } from "@/lib/timezones";
import type { CalItem } from "./types";

const MAX_VISIBLE = 3;

export function MonthView({
  refDate,
  items,
  onSelectItem,
  onShowMore,
}: {
  refDate: Date;
  items: CalItem[];
  onSelectItem: (item: CalItem) => void;
  onShowMore: (day: Date, items: CalItem[]) => void;
}) {
  const monthStart = startOfMonth(refDate);
  const monthEnd = endOfMonth(refDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const byDay = (day: Date) =>
    items
      .filter((i) => isSameDay(new Date(i.start), day))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <div className="rounded-xl border overflow-hidden bg-card">
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {DAY_LABELS_SHORT.map((d) => (
          <div key={d} className="px-2 py-2 text-xs font-medium text-muted-foreground text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayItems = byDay(day);
          const visible = dayItems.slice(0, MAX_VISIBLE);
          const overflow = dayItems.length - visible.length;
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-28 border-b border-r p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0 flex flex-col gap-1",
                !isSameMonth(day, refDate) && "bg-muted/20"
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium size-5 flex items-center justify-center rounded-full shrink-0",
                  isToday(day) && "bg-primary text-primary-foreground",
                  !isSameMonth(day, refDate) && !isToday(day) && "text-muted-foreground"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="space-y-0.5 min-w-0">
                {visible.map((item) => (
                  <EventPill key={item.id} item={item} onClick={() => onSelectItem(item)} />
                ))}
                {overflow > 0 && (
                  <button
                    type="button"
                    onClick={() => onShowMore(day, dayItems)}
                    className="text-[11px] text-muted-foreground hover:text-foreground px-1.5"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
