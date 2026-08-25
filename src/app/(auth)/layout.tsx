import { BrandWordmark } from "@/components/brand-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-between p-8 sm:p-12">
        <BrandWordmark />
        <div className="w-full max-w-sm mx-auto">{children}</div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Project Hub. All rights reserved.
        </p>
      </div>
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-primary/[0.08] via-accent/40 to-background border-l">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative m-auto max-w-md p-12 space-y-6">
          <blockquote className="text-xl font-medium leading-relaxed text-foreground/90">
            &ldquo;Everything my client needs to know — tasks, files, deadlines, approvals — lives
            in one place now. No more digging through WhatsApp threads.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-semibold text-primary">
              AR
            </div>
            <div className="text-sm">
              <div className="font-medium">Abdul Rahman</div>
              <div className="text-muted-foreground">Founder, Nuxy Studio</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
