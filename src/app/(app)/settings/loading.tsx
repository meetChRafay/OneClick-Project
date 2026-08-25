import { PageHeaderSkeleton, TabsRowSkeleton, DetailBodySkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton withAction={false} />
      <TabsRowSkeleton count={4} />
      <DetailBodySkeleton />
    </div>
  );
}
