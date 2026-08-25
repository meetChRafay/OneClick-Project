import { PageHeaderSkeleton, DashboardSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton withAction={false} />
      <DashboardSkeleton />
    </div>
  );
}
