import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { ActivityTimeline } from "@/components/activity-timeline";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  const user = await requireAdmin();
  const repo = getRepository();

  const [logs, profiles] = await Promise.all([
    repo.listActivity(user.organizationId, { limit: 100 }),
    repo.listProfiles(user.organizationId),
  ]);

  const actorNames = new Map(profiles.map((p) => [p.id, p.full_name]));

  return (
    <div>
      <PageHeader title="Activity" subtitle="Everything happening across your organization" />
      <div className="px-4 lg:px-6 pb-10 max-w-2xl">
        <ActivityTimeline logs={logs} actorNames={actorNames} />
      </div>
    </div>
  );
}
