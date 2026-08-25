"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/user-avatar";
import { updateOrganizationAction } from "@/lib/actions/settings";

export function OrganizationSettingsForm({
  orgName,
  team,
}: {
  orgName: string;
  team: { id: string; name: string; title?: string | null }[];
}) {
  const [name, setName] = useState(orgName);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateOrganizationAction(name);
        setDirty(false);
        toast.success("Organization updated");
      } catch {
        toast.error("Couldn't update organization");
      }
    });
  }

  return (
    <div className="max-w-lg space-y-6">
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label>Organization name</Label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setDirty(true);
            }}
            required
          />
        </div>
        {dirty && (
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save changes
          </Button>
        )}
      </form>

      <div>
        <p className="text-sm font-medium mb-2.5">Team ({team.length})</p>
        <div className="space-y-2">
          {team.map((member) => (
            <div key={member.id} className="flex items-center gap-2.5 rounded-lg border px-3 py-2">
              <UserAvatar name={member.name} id={member.id} size="sm" />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{member.name}</div>
                {member.title && <div className="text-xs text-muted-foreground truncate">{member.title}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
