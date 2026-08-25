import { PageHeaderSkeleton, CardGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton withAction={false} />
      <CardGridSkeleton count={4} />
    </div>
  );
}
