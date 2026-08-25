import { PageHeaderSkeleton, TabsRowSkeleton, ListRowsSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton withAction={false} />
      <TabsRowSkeleton count={6} />
      <ListRowsSkeleton count={6} />
    </div>
  );
}
