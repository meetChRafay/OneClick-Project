"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import { addTemporaryAvailabilityAction } from "@/lib/actions/availability";
import type { TemporaryAvailability } from "@/types/domain";

export function TemporaryAvailabilityList({ slots }: { slots: TemporaryAvailability[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await addTemporaryAvailabilityAction({ date, start, end, note });
        toast.success("Added");
        setOpen(false);
        setDate("");
        setStart("");
        setEnd("");
        setNote("");
      } catch {
        toast.error("Couldn't add that slot");
      }
    });
  }

  return (
    <div className="space-y-2.5">
      {slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">No one-off availability added yet.</p>
      ) : (
        slots.map((s) => (
          <Card key={s.id} className="p-0">
            <div className="p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">
                  {formatDate(s.date + "T00:00:00", { weekday: "long", month: "short", day: "numeric" })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {s.start} – {s.end} {s.note && `· ${s.note}`}
                </div>
              </div>
            </div>
          </Card>
        ))
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="size-3.5" /> Add availability
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72">
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Start</Label>
                <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End</Label>
                <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Note (optional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Quick review call" />
            </div>
            <Button type="submit" size="sm" className="w-full" disabled={pending || !date || !start || !end}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              Add
            </Button>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
}
