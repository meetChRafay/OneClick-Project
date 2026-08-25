import Link from "next/link";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Create your workspace</h1>
        <p className="text-sm text-muted-foreground">
          Start your 14-day trial. No credit card required.
        </p>
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

      <SignupForm />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
