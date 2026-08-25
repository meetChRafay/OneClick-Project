import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>
      <ForgotPasswordForm />
      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to sign in
      </Link>
    </div>
  );
}
