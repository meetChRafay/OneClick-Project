import { PageHeaderSkeleton, TabsRowSkeleton, ListRowsSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <TabsRowSkeleton count={3} />
      <ListRowsSkeleton count={5} />
    </div>
  );
}
