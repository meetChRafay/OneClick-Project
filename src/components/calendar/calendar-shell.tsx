"use client";

import { useMemo, useState } from "react";
import { addMonths, subMonths, addWeeks, subWeeks, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonthView } from "./month-view";
import { WeekView } from "./week-view";
import { AgendaView } from "./agenda-view";
import { EventDetailDialog } from "./event-detail-dialog";
import { DayDetailDialog } from "./day-detail-dialog";
import { NewEventDialog } from "./new-event-dialog";
import type { CalItem } from "./types";

type View = "month" | "week" | "agenda";

export function CalendarShell({
  items,
  projects,
  profiles,
  canCreate,
}: {
  items: CalItem[];
  projects: { id: string; name: string }[];
  profiles: { id: string; name: string }[];
  canCreate: boolean;
}) {
  const [view, setView] = useState<View>("month");
  const [refDate, setRefDate] = useState(() => new Date());
  const [projectId, setProjectId] = useState("all");
  const [selectedItem, setSelectedItem] = useState<CalItem | null>(null);
  const [dayDetail, setDayDetail] = useState<{ day: Date; items: CalItem[] } | null>(null);

  const filtered = useMemo(
    () => (projectId === "all" ? items : items.filter((i) => i.projectId === projectId)),
    [items, projectId]
  );

  function navigate(direction: -1 | 1) {
    setRefDate((d) => {
      if (view === "week") return direction === 1 ? addWeeks(d, 1) : subWeeks(d, 1);
      return direction === 1 ? addMonths(d, 1) : subMonths(d, 1);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
          </TabsList>
        </Tabs>

        {view !== "agenda" && (
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="size-8" onClick={() => navigate(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setRefDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => navigate(1)}>
              <ChevronRight className="size-4" />
            </Button>
            <span className="text-sm font-medium ml-1">{format(refDate, "MMMM yyyy")}</span>
          </div>
        )}

        <div className="flex items-center gap-2 sm:ml-auto">
          {projects.length > 1 && (
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="w-44 shrink-0"><SelectValue placeholder="All projects" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {canCreate && <NewEventDialog projects={projects} profiles={profiles} />}
        </div>
      </div>

      {view === "month" && (
        <MonthView
          refDate={refDate}
          items={filtered}
          onSelectItem={setSelectedItem}
          onShowMore={(day, dayItems) => setDayDetail({ day, items: dayItems })}
        />
      )}
      {view === "week" && <WeekView refDate={refDate} items={filtered} onSelectItem={setSelectedItem} />}
      {view === "agenda" && <AgendaView items={filtered} onSelectItem={setSelectedItem} />}

      <EventDetailDialog item={selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)} />
      <DayDetailDialog
        day={dayDetail?.day ?? null}
        items={dayDetail?.items ?? []}
        onOpenChange={(open) => !open && setDayDetail(null)}
        onSelectItem={(item) => {
          setDayDetail(null);
          setSelectedItem(item);
        }}
      />
    </div>
  );
}
