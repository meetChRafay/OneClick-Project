import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-status-info-bg text-status-info">
        <MailCheck className="size-6" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a verification link to your inbox. Click it to activate your account.
        </p>
      </div>
      <Button variant="outline" className="w-full" type="button">
        Resend verification email
      </Button>
      <Link href="/login" className="block text-sm text-muted-foreground hover:text-foreground">
        Back to sign in
      </Link>
    </div>
  );
}
