"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, X, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { completeOnboardingAction } from "@/lib/actions/settings";

export interface OnboardingItem {
  label: string;
  done: boolean;
  href: string;
}

export function OnboardingChecklist({ items }: { items: OnboardingItem[] }) {
  const [pending, startTransition] = useTransition();
  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length;

  function dismiss() {
    startTransition(async () => {
      try {
        await completeOnboardingAction();
      } catch {
        toast.error("Couldn't dismiss");
      }
    });
  }

  return (
    <Card className="p-4 mb-6 border-primary/20 bg-primary/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium">Getting started</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {allDone ? "You're all set up." : `${doneCount} of ${items.length} steps complete`}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={dismiss} disabled={pending}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
        </Button>
      </div>
      <Progress value={(doneCount / items.length) * 100} className="h-1.5 mt-3 mb-3.5" />
      <div className="space-y-1">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.done ? undefined : item.href}
            className="flex items-center gap-2 text-sm py-1.5 hover:underline"
          >
            {item.done ? (
              <CheckCircle2 className="size-4 text-status-success shrink-0" />
            ) : (
              <Circle className="size-4 text-muted-foreground shrink-0" />
            )}
            <span className={item.done ? "text-muted-foreground line-through" : ""}>{item.label}</span>
          </a>
        ))}
      </div>
    </Card>
  );
}
