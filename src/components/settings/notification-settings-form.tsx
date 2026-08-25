"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { updateNotificationPrefsAction } from "@/lib/actions/settings";
import { DEFAULT_NOTIFICATION_PREFS, type NotificationPrefs } from "@/types/domain";

const ROWS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: "email", label: "Email notifications", description: "Receive a copy of your notifications by email." },
  { key: "task_assigned", label: "Task assigned to me", description: "When someone assigns you a task." },
  { key: "comments_mentions", label: "Comments & mentions", description: "New comments on your tasks and issues, and whenever you're @mentioned." },
  { key: "approvals", label: "Approvals", description: "Approval requests and decisions on your projects." },
  { key: "deadlines", label: "Deadline reminders", description: "Upcoming and overdue task deadlines." },
];

export function NotificationSettingsForm({ initialPrefs }: { initialPrefs: NotificationPrefs | null | undefined }) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initialPrefs ?? DEFAULT_NOTIFICATION_PREFS);
  const [, startTransition] = useTransition();

  function toggle(key: keyof NotificationPrefs, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    startTransition(async () => {
      try {
        await updateNotificationPrefsAction(next);
      } catch {
        toast.error("Couldn't save that preference");
        setPrefs(prefs);
      }
    });
  }

  return (
    <div className="max-w-lg divide-y">
      {ROWS.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-4 py-3.5 first:pt-0">
          <div className="min-w-0">
            <div className="text-sm font-medium">{row.label}</div>
            <p className="text-xs text-muted-foreground mt-0.5">{row.description}</p>
          </div>
          <Switch checked={prefs[row.key]} onCheckedChange={(v) => toggle(row.key, v)} />
        </div>
      ))}
    </div>
  );
}
