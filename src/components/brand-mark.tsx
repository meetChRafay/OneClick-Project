import { cn } from "@/lib/utils";

export function BrandMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold shrink-0",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      O
    </div>
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <BrandMark />
      <span className="font-semibold tracking-tight">OneClick Project</span>
    </div>
  );
}
