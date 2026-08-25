"use client";

import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, format } from "date-fns";
import { cn } from "@/lib/utils";
import { EventPill } from "./event-pill";
import type { CalItem } from "./types";

export function WeekView({
  refDate,
  items,
  onSelectItem,
}: {
  refDate: Date;
  items: CalItem[];
  onSelectItem: (item: CalItem) => void;
}) {
  const start = startOfWeek(refDate);
  const end = endOfWeek(refDate);
  const days = eachDayOfInterval({ start, end });

  const byDay = (day: Date) =>
    items
      .filter((i) => isSameDay(new Date(i.start), day))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
      {days.map((day) => {
        const dayItems = byDay(day);
        return (
          <div key={day.toISOString()} className="rounded-xl border bg-card min-h-40 flex flex-col">
            <div
              className={cn(
                "px-2.5 py-2 border-b flex items-center justify-between",
                isToday(day) && "bg-primary/5"
              )}
            >
              <span className="text-xs font-medium text-muted-foreground">{format(day, "EEE")}</span>
              <span
                className={cn(
                  "text-xs font-semibold size-5 flex items-center justify-center rounded-full",
                  isToday(day) && "bg-primary text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </span>
            </div>
            <div className="p-1.5 space-y-1 flex-1">
              {dayItems.length === 0 ? (
                <p className="text-[11px] text-muted-foreground/60 px-1 py-2 text-center">No events</p>
              ) : (
                dayItems.map((item) => <EventPill key={item.id} item={item} onClick={() => onSelectItem(item)} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
