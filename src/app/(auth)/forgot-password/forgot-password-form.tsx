"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { forgotPasswordAction, type ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = { ok: false };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  if (state?.ok) {
    return (
      <div className="rounded-lg border border-status-success/30 bg-status-success-bg px-4 py-4 text-sm text-status-success flex gap-2.5">
        <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
        <span>Check your inbox — we&apos;ve sent a password reset link.</span>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-status-danger/30 bg-status-danger-bg px-3 py-2 text-sm text-status-danger">
          {state.error}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@company.com" required autoFocus />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Send reset link
      </Button>
    </form>
  );
}
