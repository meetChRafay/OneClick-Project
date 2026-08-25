"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { signupAction, type ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = { ok: true };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-status-info/30 bg-status-info-bg px-3 py-2 text-sm text-status-info">
          {state.error}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" placeholder="Jane Cooper" required autoFocus />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Work email</Label>
        <Input id="email" name="email" type="email" placeholder="you@company.com" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" placeholder="Minimum 8 characters" required />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Create workspace
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        By continuing you agree to the Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}
