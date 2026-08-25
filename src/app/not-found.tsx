import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-background">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <SearchX className="size-5 text-muted-foreground" />
      </div>
      <h1 className="text-lg font-semibold">Page not found</h1>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Button asChild className="mt-5">
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  );
}
