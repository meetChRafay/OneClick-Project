"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";
import type { ContentPipelineStage, Priority, Topic, TopicStatus, VideoWorkflowStage } from "@/types/domain";

const STAGE_TO_PIPELINE: Record<VideoWorkflowStage, ContentPipelineStage> = {
  topic_idea: "ideas",
  topic_approved: "research",
  research: "research",
  script: "script",
  script_review: "script",
  voiceover: "voiceover",
  visual_production: "editing",
  editing: "editing",
  internal_review: "review",
  client_review: "review",
  corrections: "corrections",
  final_approval: "approved",
  thumbnail: "approved",
  seo: "approved",
  upload: "approved",
  published: "published",
};

export async function createTopicAction(input: {
  projectId: string;
  title: string;
  description?: string;
  priority?: Priority;
  assigneeId?: string | null;
  expectedStart?: string | null;
}) {
  // Topics are admin/agency-only at the database level (topics_write_admin
  // in 0002_rls_policies.sql) — matching that here means a client hitting
  // this directly gets sent to their dashboard instead of a raw RLS crash.
  const user = await requireAdmin();
  const repo = getRepository();
  const topic = await repo.createTopic({
    organization_id: user.organizationId,
    project_id: input.projectId,
    title: input.title,
    description: input.description ?? null,
    status: "idea",
    pipeline_stage: "ideas",
    workflow_stage: "topic_idea",
    assignee_id: input.assigneeId ?? null,
    priority: input.priority ?? "medium",
    expected_start: input.expectedStart ?? null,
    published_at: null,
  });
  revalidatePath("/topics");
  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath("/dashboard");
  return topic;
}

export async function advanceTopicStageAction(topicId: string, stage: VideoWorkflowStage) {
  // Same admin-only reality as createTopicAction above — the UI already
  // hides this behind canEdit, this is the matching server-side guard.
  const user = await requireAdmin();
  const repo = getRepository();
  const topic = await repo.getTopic(topicId);
  if (!topic) throw new Error("Topic not found");

  let status: TopicStatus = topic.status;
  if (stage === "published") status = "published";
  else if (stage === "client_review" || stage === "internal_review") status = "in_review";
  else if (stage === "topic_idea") status = "idea";
  else if (stage === "topic_approved") status = "ready_to_start";
  else status = "in_progress";

  const updated = await repo.updateTopic(topicId, {
    workflow_stage: stage,
    pipeline_stage: STAGE_TO_PIPELINE[stage],
    status,
    published_at: stage === "published" ? new Date().toISOString() : topic.published_at,
  });
  await repo.logActivity({
    organization_id: user.organizationId,
    project_id: topic.project_id,
    entity_type: "topic",
    entity_id: topicId,
    actor_id: user.id,
    action: `moved "${topic.title}" to ${stage.replace(/_/g, " ")}`,
  });
  revalidatePath("/topics");
  revalidatePath("/dashboard");
  return updated;
}

export async function updateTopicAction(topicId: string, patch: Partial<Topic>) {
  await requireAdmin();
  const repo = getRepository();
  const updated = await repo.updateTopic(topicId, patch);
  revalidatePath("/topics");
  return updated;
}
