import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { getAccessibleProjectIds } from "@/lib/authz";
import { PageHeader } from "@/components/page-header";
import { NextTopicCard } from "@/components/next-topic-card";
import { TopicPipelineBoard } from "@/components/topics/topic-pipeline-board";
import { NewTopicDialog } from "@/components/topics/new-topic-dialog";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Topics" };

export default async function TopicsPage() {
  const user = await requireUser();
  const repo = getRepository();

  const scope = await getAccessibleProjectIds(repo, user);
  const [allTopics, projects, profiles] = await Promise.all([
    repo.listTopics(user.organizationId),
    repo.listProjects(user.organizationId, user.role === "client" ? { profileId: user.id } : undefined),
    repo.listProfiles(user.organizationId),
  ]);

  const topics = allTopics.filter((t) => !scope || scope.has(t.project_id));
  const nextTopic = await repo.getNextTopic(user.organizationId);
  const profileMap = new Map(profiles.map((p) => [p.id, p.full_name]));
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  return (
    <div>
      <PageHeader
        title="Topics"
        subtitle="Your content pipeline, from idea to published video."
        actions={user.role === "admin" ? <NewTopicDialog projects={projects.map((p) => ({ id: p.id, name: p.name }))} /> : undefined}
      />
      <div className="px-4 lg:px-6 pb-10 space-y-6">
        <div className="max-w-sm">
          <NextTopicCard topic={nextTopic} assigneeName={nextTopic?.assignee_id ? profileMap.get(nextTopic.assignee_id) : null} />
        </div>

        {topics.length === 0 ? (
          <EmptyState icon={Sparkles} title="No topics yet" description="Add your first content idea to start the pipeline." />
        ) : (
          <TopicPipelineBoard topics={topics} profileMap={profileMap} projectMap={projectMap} canEdit={user.role === "admin"} />
        )}
      </div>
    </div>
  );
}
