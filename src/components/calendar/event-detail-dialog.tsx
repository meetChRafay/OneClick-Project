"use client";

import Link from "next/link";
import { MapPin, Users, FolderKanban, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { EVENT_TYPE_META } from "./event-meta";
import type { CalItem } from "./types";

export function EventDetailDialog({ item, onOpenChange }: { item: CalItem | null; onOpenChange: (open: boolean) => void }) {
  const meta = item ? EVENT_TYPE_META[item.type] : null;
  const Icon = meta?.icon;
  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent>
        {item && meta && Icon && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className={`inline-flex size-7 items-center justify-center rounded-lg ${meta.chip}`}>
                  <Icon className="size-3.5" />
                </span>
                {item.title}
              </DialogTitle>
              <DialogDescription>
                {item.allDay ? "All day" : `${formatDateTime(item.start)}${item.end !== item.start ? ` – ${formatDateTime(item.end)}` : ""}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2.5 text-sm">
              <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
              {item.projectName && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FolderKanban className="size-3.5 shrink-0" /> {item.projectName}
                </div>
              )}
              {item.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" /> {item.location}
                </div>
              )}
              {item.attendeeNames.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="size-3.5 shrink-0" /> {item.attendeeNames.join(", ")}
                </div>
              )}
            </div>
            {item.href && (
              <Button asChild size="sm" variant="secondary" className="w-full">
                <Link href={item.href}>
                  {item.type === "task_deadline" ? "Open task" : "Open project"}
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
