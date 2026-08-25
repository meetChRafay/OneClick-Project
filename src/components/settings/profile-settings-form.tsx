"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserAvatar } from "@/components/user-avatar";
import { updateProfileSettingsAction } from "@/lib/actions/settings";
import { COMMON_TIMEZONES, timezoneAbbrev } from "@/lib/timezones";
import type { Profile } from "@/types/domain";

export function ProfileSettingsForm({ profile }: { profile: Profile }) {
  const [pending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(profile.full_name);
  const [title, setTitle] = useState(profile.title ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [timezone, setTimezone] = useState(profile.timezone);
  const [dirty, setDirty] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateProfileSettingsAction({ fullName, title: title || null, phone: phone || null, timezone });
        setDirty(false);
        toast.success("Profile updated");
      } catch {
        toast.error("Couldn't update your profile");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-lg">
      <div className="flex items-center gap-3">
        <UserAvatar name={fullName || profile.full_name} id={profile.id} size="lg" />
        <div className="text-sm text-muted-foreground">
          Profile photos sync automatically from Google once connected.
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Full name</Label>
        <Input
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setDirty(true);
          }}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input value={profile.email} disabled />
        <p className="text-xs text-muted-foreground">Your email is managed by your account and can&apos;t be changed here.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Job title</Label>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
            placeholder="e.g. Video Editor"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setDirty(true);
            }}
            placeholder="Optional"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Timezone</Label>
        <Select
          value={timezone}
          onValueChange={(v) => {
            setTimezone(v);
            setDirty(true);
          }}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {COMMON_TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz.replace(/_/g, " ")} ({timezoneAbbrev(tz)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {dirty && (
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          Save changes
        </Button>
      )}
    </form>
  );
}
