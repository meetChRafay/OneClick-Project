"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { cn, relativeTime } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/lib/actions/notifications";
import type { Notification } from "@/types/domain";

const TYPE_EMOJI: Record<Notification["type"], string> = {
  task_assigned: "✅",
  task_new: "🆕",
  deadline_approaching: "⏰",
  task_overdue: "🔴",
  new_comment: "💬",
  mention: "💬",
  new_file: "📎",
  approval_request: "📝",
  approval_received: "✅",
  availability_request: "📅",
  issue_created: "🐛",
  issue_resolved: "✅",
  project_update: "📊",
  invoice_sent: "🧾",
  payment_received: "💰",
};

export function NotificationsDropdown({
  notifications,
  profileId,
}: {
  notifications: Notification[];
  profileId: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const unread = notifications.filter((n) => !n.read);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4.5" />
          {unread.length > 0 && (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-status-danger text-[9px] font-semibold text-white animate-in zoom-in-50">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-3 py-2.5 border-b">
          <span className="text-sm font-semibold">Notifications</span>
          {unread.length > 0 && (
            <button
              disabled={pending}
              onClick={() => startTransition(() => markAllNotificationsReadAction(profileId))}
              className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50 cursor-pointer"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "#"}
                  onClick={() => {
                    setOpen(false);
                    if (!n.read) startTransition(() => markNotificationReadAction(n.id));
                  }}
                  className={cn(
                    "flex gap-2.5 px-3 py-2.5 text-sm hover:bg-accent/60 transition-colors",
                    !n.read && "bg-accent/30"
                  )}
                >
                  <span className="text-base leading-none mt-0.5">{TYPE_EMOJI[n.type] ?? "🔔"}</span>
                  <div className="min-w-0 flex-1">
                    <div className={cn("truncate", !n.read && "font-medium")}>{n.title}</div>
                    {n.body && <div className="text-xs text-muted-foreground line-clamp-2">{n.body}</div>}
                    <div className="text-[11px] text-muted-foreground mt-0.5">{relativeTime(n.created_at)}</div>
                  </div>
                  {!n.read && <span className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
