"use client";

import { cn, formatTime } from "@/lib/utils";
import { EVENT_TYPE_META } from "./event-meta";
import type { CalItem } from "./types";

export function EventPill({ item, onClick }: { item: CalItem; onClick?: () => void }) {
  const meta = EVENT_TYPE_META[item.type];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium truncate transition-colors",
        meta.chip,
        item.completed && "opacity-50 line-through"
      )}
      title={item.title}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", meta.dot)} />
      {!item.allDay && <span className="shrink-0 tabular-nums">{formatTime(item.start)}</span>}
      <span className="truncate">{item.title}</span>
    </button>
  );
}
