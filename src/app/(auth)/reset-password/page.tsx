"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { updatePasswordAction, type ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = { ok: false };

export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialState);
  const confirmRef = useRef<HTMLInputElement>(null);
  const [mismatch, setMismatch] = useState(false);

  if (state?.ok) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-status-success/30 bg-status-success-bg px-4 py-4 text-sm text-status-success flex gap-2.5">
          <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
          <span>Your password has been updated. You can now sign in.</span>
        </div>
        <Button className="w-full" onClick={() => router.push("/login")}>
          Continue to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="text-sm text-muted-foreground">Choose a strong password you haven&apos;t used before.</p>
      </div>
      <form
        action={formAction}
        onSubmit={(e) => {
          if (confirmRef.current && (e.currentTarget.elements.namedItem("password") as HTMLInputElement)?.value !== confirmRef.current.value) {
            e.preventDefault();
            setMismatch(true);
          } else {
            setMismatch(false);
          }
        }}
        className="space-y-4"
      >
        {(state?.error || mismatch) && (
          <div className="rounded-lg border border-status-danger/30 bg-status-danger-bg px-3 py-2 text-sm text-status-danger">
            {mismatch ? "Passwords don't match." : state.error}
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" placeholder="Minimum 8 characters" required autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" ref={confirmRef} type="password" placeholder="Re-enter password" required />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Update password
        </Button>
      </form>
    </div>
  );
}
