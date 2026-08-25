import { PageHeaderSkeleton, CardGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton withAction={false} />
      <div className="px-4 lg:px-6 pb-10 space-y-6">
        <CardGridSkeleton count={4} />
        <CardGridSkeleton count={2} />
      </div>
    </div>
  );
}
