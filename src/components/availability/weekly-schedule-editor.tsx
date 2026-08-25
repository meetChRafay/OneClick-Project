"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DAY_LABELS } from "@/lib/timezones";
import { COMMON_TIMEZONES } from "@/lib/timezones";
import { updateWeeklyScheduleAction } from "@/lib/actions/availability";
import type { DaySchedule } from "@/types/domain";

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday-first display

export function WeeklyScheduleEditor({
  schedule,
  timezone,
}: {
  schedule: DaySchedule[];
  timezone: string;
}) {
  const [days, setDays] = useState<DaySchedule[]>(() =>
    ORDER.map((d) => schedule.find((s) => s.day === d) ?? { day: d as DaySchedule["day"], enabled: false })
  );
  const [tz, setTz] = useState(timezone);
  const [pending, startTransition] = useTransition();

  function update(day: number, patch: Partial<DaySchedule>) {
    setDays((prev) => prev.map((d) => (d.day === day ? { ...d, ...patch } : d)));
  }

  function save() {
    startTransition(async () => {
      try {
        await updateWeeklyScheduleAction(days, tz);
        toast.success("Availability schedule saved");
      } catch {
        toast.error("Couldn't save your schedule");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Timezone</label>
        <Select value={tz} onValueChange={setTz}>
          <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            {COMMON_TIMEZONES.map((z) => (
              <SelectItem key={z} value={z}>{z.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {days.map((d) => (
          <div key={d.day} className="flex items-center gap-3">
            <div className="w-24 shrink-0 flex items-center gap-2">
              <Switch checked={d.enabled} onCheckedChange={(v) => update(d.day, { enabled: v })} />
              <span className="text-sm">{DAY_LABELS[d.day]}</span>
            </div>
            {d.enabled ? (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  className="h-8 w-28"
                  value={d.start ?? "09:00"}
                  onChange={(e) => update(d.day, { start: e.target.value })}
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="time"
                  className="h-8 w-28"
                  value={d.end ?? "18:00"}
                  onChange={(e) => update(d.day, { end: e.target.value })}
                />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Unavailable</span>
            )}
          </div>
        ))}
      </div>

      <Button size="sm" onClick={save} disabled={pending}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
        Save schedule
      </Button>
    </div>
  );
}
