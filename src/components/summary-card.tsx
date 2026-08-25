import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const TONE_STYLES: Record<string, string> = {
  neutral: "bg-status-neutral-bg text-status-neutral",
  danger: "bg-status-danger-bg text-status-danger",
  warning: "bg-status-warning-bg text-status-warning",
  success: "bg-status-success-bg text-status-success",
  info: "bg-status-info-bg text-status-info",
};

export function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  href,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: "neutral" | "danger" | "warning" | "success" | "info";
  href?: string;
  hint?: string;
}) {
  const content = (
    <Card className="p-0 hover:shadow-md transition-shadow h-full">
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold tracking-tight mt-1">{value}</div>
          {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
        </div>
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", TONE_STYLES[tone])}>
          <Icon className="size-4.5" />
        </div>
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }
  return content;
}
