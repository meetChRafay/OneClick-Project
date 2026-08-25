import { DetailHeaderSkeleton, DetailBodySkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <DetailHeaderSkeleton />
      <DetailBodySkeleton />
    </div>
  );
}
