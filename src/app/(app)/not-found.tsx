import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <SearchX className="size-5 text-muted-foreground" />
      </div>
      <h2 className="text-base font-semibold">We couldn&apos;t find that</h2>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        This page doesn&apos;t exist, or you don&apos;t have access to it.
      </p>
      <Button asChild className="mt-5">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
