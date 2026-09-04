"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateProjectAction } from "@/lib/actions/projects";

export function DriveLinkEditor({ projectId, initialUrl }: { projectId: string; initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        await updateProjectAction(projectId, { drive_folder_url: url.trim() || null });
        setDirty(false);
        toast.success("Drive link saved");
      } catch {
        toast.error("Couldn't save the link");
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setDirty(true);
          }}
          placeholder="Paste the Google Drive folder link here…"
          className="flex-1"
        />
        {dirty && (
          <Button size="sm" variant="secondary" onClick={save} disabled={pending}>
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save
          </Button>
        )}
      </div>
      {!dirty && url && (
        <a href={url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1.5">
          Open in Google Drive <ExternalLink className="size-3.5" />
        </a>
      )}
    </div>
  );
}
