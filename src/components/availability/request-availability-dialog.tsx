"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarClock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAvailabilityRequestAction } from "@/lib/actions/availability";

export function RequestAvailabilityDialog({ people }: { people: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [requestedOf, setRequestedOf] = useState(people[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [purpose, setPurpose] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createAvailabilityRequestAction({ requestedOf, date, start, end, purpose });
        toast.success("Availability request sent");
        setOpen(false);
        setDate("");
        setStart("");
        setEnd("");
        setPurpose("");
      } catch {
        toast.error("Couldn't send that request");
      }
    });
  }

  if (people.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <CalendarClock className="size-4" />
          Request Availability
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What time are you available?</DialogTitle>
          <DialogDescription>Ask when someone can review or meet.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Ask</Label>
            <Select value={requestedOf} onValueChange={setRequestedOf}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {people.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Start</Label>
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Purpose</Label>
            <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Review Video #3" required />
          </div>
          <Button type="submit" className="w-full" disabled={pending || !date || !start || !end || !purpose}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Send request
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
