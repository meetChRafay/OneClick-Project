import Link from "next/link";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DemoAccounts } from "@/components/demo-accounts";
import { LoginForm } from "./login-form";

export default function LoginPage() {
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

      <LoginForm />

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
