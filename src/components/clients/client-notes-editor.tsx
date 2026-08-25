"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateClientNotesAction } from "@/lib/actions/clients";

export function ClientNotesEditor({ clientId, initialNotes }: { clientId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        await updateClientNotesAction(clientId, notes);
        setDirty(false);
        toast.success("Notes saved");
      } catch {
        toast.error("Couldn't save notes");
      }
    });
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setDirty(true);
        }}
        placeholder="Private notes about this client — never visible to them…"
        className="min-h-24"
      />
      {dirty && (
        <Button size="sm" variant="secondary" onClick={save} disabled={pending}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          Save notes
        </Button>
      )}
    </div>
  );
}
