"use client";

import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EventPill } from "./event-pill";
import type { CalItem } from "./types";

export function DayDetailDialog({
  day,
  items,
  onOpenChange,
  onSelectItem,
}: {
  day: Date | null;
  items: CalItem[];
  onOpenChange: (open: boolean) => void;
  onSelectItem: (item: CalItem) => void;
}) {
  return (
    <Dialog open={!!day} onOpenChange={onOpenChange}>
      <DialogContent>
        {day && (
          <>
            <DialogHeader>
              <DialogTitle>{format(day, "EEEE, MMMM d, yyyy")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              {items.map((item) => (
                <EventPill key={item.id} item={item} onClick={() => onSelectItem(item)} />
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
