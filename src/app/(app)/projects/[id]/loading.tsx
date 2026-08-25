import { DetailHeaderSkeleton, TabsRowSkeleton, DetailBodySkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <DetailHeaderSkeleton />
      <TabsRowSkeleton count={7} />
      <DetailBodySkeleton />
    </div>
  );
}
