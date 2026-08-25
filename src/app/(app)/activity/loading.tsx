import { PageHeaderSkeleton, ListRowsSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton withAction={false} />
      <ListRowsSkeleton count={8} />
    </div>
  );
}
