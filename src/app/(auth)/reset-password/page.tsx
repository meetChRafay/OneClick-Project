"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
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
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setPending(true);
          setTimeout(() => {
            setPending(false);
            setDone(true);
          }, 600);
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" placeholder="Minimum 8 characters" required autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" placeholder="Re-enter password" required />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Update password
        </Button>
      </form>
    </div>
  );
}
