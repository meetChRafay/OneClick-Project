"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { acceptInvitationAction, type ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const initialState: ActionResult = { ok: false };

export function AcceptInvitationForm({
  email,
  inviterName,
  defaultName,
}: {
  email: string;
  inviterName: string;
  defaultName: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(acceptInvitationAction, initialState);

  if (state?.ok) {
    router.push("/dashboard");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback>
              {inviterName
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <span className="font-medium">{inviterName}</span>{" "}
            <span className="text-muted-foreground">invited you</span>
          </div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Finish setting up your account</h1>
        <p className="text-sm text-muted-foreground">Create a password to get started.</p>
      </div>

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="rounded-lg border border-status-danger/30 bg-status-danger-bg px-3 py-2 text-sm text-status-danger">
            {state.error}
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" defaultValue={defaultName} placeholder="Your full name" required autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Create password</Label>
          <Input id="password" name="password" type="password" placeholder="Minimum 8 characters" required />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Accept invitation
        </Button>
      </form>
    </div>
  );
}
