import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function PageHeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 lg:px-6 pt-6 pb-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      {withAction && <Skeleton className="h-9 w-28 shrink-0" />}
    </div>
  );
}

export function TabsRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-2 px-4 lg:px-6 mb-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-24 rounded-lg" />
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="px-4 lg:px-6 pb-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-0 overflow-hidden">
          <Skeleton className="h-16 w-full rounded-none" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-1.5 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-14" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ListRowsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="px-4 lg:px-6 pb-10 space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <Skeleton className="size-5 rounded-full shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-6 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function DetailHeaderSkeleton() {
  return (
    <div className="px-4 lg:px-6 pt-6 pb-4 space-y-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-7 w-72" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
  );
}

export function DetailBodySkeleton() {
  return (
    <div className="px-4 lg:px-6 pb-10 max-w-3xl space-y-4">
      <Card className="p-5 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </Card>
      <Card className="p-5 space-y-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-16 w-full" />
      </Card>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="px-4 lg:px-6 pb-10 space-y-5">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 space-y-2.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-7 w-14" />
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-1.5 w-full" />
            </Card>
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-28" />
          <Card className="p-4 space-y-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </Card>
        </div>
      </div>
    </div>
  );
}

export function BoardSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="px-4 lg:px-6 pb-10 flex gap-4 overflow-x-auto">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="w-64 shrink-0 space-y-2.5">
          <Skeleton className="h-4 w-24" />
          <Card className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </Card>
          <Card className="p-3 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-2/5" />
          </Card>
        </div>
      ))}
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="px-4 lg:px-6 pb-10 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-8 w-32 rounded-lg ml-auto" />
      </div>
      <div className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="px-2 py-2">
              <Skeleton className="h-3 w-6 mx-auto" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-28 border-b border-r p-1.5 last:border-r-0">
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
