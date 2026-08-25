import { PageHeaderSkeleton, TabsRowSkeleton, CardGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <TabsRowSkeleton count={8} />
      <CardGridSkeleton count={6} />
    </div>
  );
}
