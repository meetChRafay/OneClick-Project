import { PageHeaderSkeleton, CalendarSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton withAction={false} />
      <CalendarSkeleton />
    </div>
  );
}
