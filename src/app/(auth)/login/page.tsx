import Link from "next/link";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DemoAccounts } from "@/components/demo-accounts";
import { LoginForm } from "./login-form";

// Plain-English messages for the ?error=... codes that land here: from
// /auth/callback (auth_callback_failed), /accept-invitation
// (invitation_expired), and hash-session-redirect.tsx (Supabase's own
// error_code values for a one-time link that's already been used or has
// expired, e.g. otp_expired).
const ERROR_MESSAGES: Record<string, string> = {
  otp_expired: "That invitation or reset link has expired or was already used. Ask for a fresh one.",
  access_denied: "That link is no longer valid. Ask for a fresh one.",
  auth_callback_failed: "That link couldn't be verified. Ask for a fresh one and try again.",
  invitation_expired: "That invitation link has expired or was already used. Ask for a fresh one.",
  session_setup_failed: "We couldn't sign you in from that link. Ask for a fresh one and try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const banner = error ? ERROR_MESSAGES[error] ?? "That link is no longer valid. Ask for a fresh one." : undefined;

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your OneClick Project workspace.</p>
      </div>

      <Button variant="outline" className="w-full" type="button" disabled>
        <GoogleIcon className="size-4" />
        Continue with Google
        <span className="ml-auto text-[10px] text-muted-foreground font-normal">Not configured</span>
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or continue with email</span>
        <Separator className="flex-1" />
      </div>

      <LoginForm banner={banner} />

      {process.env.DATA_BACKEND !== "supabase" && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">demo accounts</span>
            <Separator className="flex-1" />
          </div>
          <DemoAccounts />
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
