import { PageHeaderSkeleton, ListRowsSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <ListRowsSkeleton count={8} />
    </div>
  );
}
