"use client";

import { useEffect } from "react";
import { AlertOctagon, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-status-danger-bg">
        <AlertOctagon className="size-5 text-status-danger" />
      </div>
      <h2 className="text-base font-semibold">Something went wrong</h2>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        Your changes couldn&apos;t be saved. Please try again — if this keeps happening, let us know.
      </p>
      <Button className="mt-5" onClick={() => reset()}>
        <RotateCw className="size-4" />
        Retry
      </Button>
    </div>
  );
}
