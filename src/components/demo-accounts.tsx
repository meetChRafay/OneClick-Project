"use client";

import { useTransition } from "react";
import { Loader2, ShieldCheck, User } from "lucide-react";
import { demoLoginAction } from "@/lib/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const DEMO_ACCOUNTS = [
  {
    id: "prof_abdul",
    name: "Abdul Rafay",
    role: "Admin · Founder & Producer",
    icon: ShieldCheck,
  },
  {
    id: "prof_constantin",
    name: "Constantin Mock",
    role: "Client · Health YouTube Channel",
    icon: User,
  },
];

export function DemoAccounts() {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      {DEMO_ACCOUNTS.map((account) => (
        <button
          key={account.id}
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => demoLoginAction(account.id))}
          className="w-full flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left transition-colors hover:bg-accent disabled:opacity-60 cursor-pointer"
        >
          <Avatar className="size-8">
            <AvatarFallback>
              {account.name
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{account.name}</div>
            <div className="text-xs text-muted-foreground truncate">{account.role}</div>
          </div>
          {pending ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <account.icon className="size-4 text-muted-foreground" />
          )}
        </button>
      ))}
    </div>
  );
}
