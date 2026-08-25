import { PageHeaderSkeleton, BoardSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <BoardSkeleton columns={6} />
    </div>
  );
}
