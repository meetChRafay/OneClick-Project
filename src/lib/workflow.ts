import type { ContentPipelineStage, VideoWorkflowStage } from "@/types/domain";

export const PIPELINE_STAGES: { value: ContentPipelineStage; label: string }[] = [
  { value: "ideas", label: "Ideas" },
  { value: "research", label: "Research" },
  { value: "script", label: "Script" },
  { value: "voiceover", label: "Voiceover" },
  { value: "editing", label: "Editing" },
  { value: "review", label: "Review" },
  { value: "corrections", label: "Corrections" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
];

export const WORKFLOW_STAGES: { value: VideoWorkflowStage; label: string }[] = [
  { value: "topic_idea", label: "Topic Idea" },
  { value: "topic_approved", label: "Topic Approved" },
  { value: "research", label: "Research" },
  { value: "script", label: "Script" },
  { value: "script_review", label: "Script Review" },
  { value: "voiceover", label: "Voiceover" },
  { value: "visual_production", label: "Visual Production" },
  { value: "editing", label: "Editing" },
  { value: "internal_review", label: "Internal Review" },
  { value: "client_review", label: "Client Review" },
  { value: "corrections", label: "Corrections" },
  { value: "final_approval", label: "Final Approval" },
  { value: "thumbnail", label: "Thumbnail" },
  { value: "seo", label: "SEO" },
  { value: "upload", label: "Upload" },
  { value: "published", label: "Published" },
];

export function workflowIndex(stage: VideoWorkflowStage) {
  return WORKFLOW_STAGES.findIndex((s) => s.value === stage);
}

export function nextWorkflowStage(stage: VideoWorkflowStage): VideoWorkflowStage | null {
  const idx = workflowIndex(stage);
  if (idx === -1 || idx === WORKFLOW_STAGES.length - 1) return null;
  return WORKFLOW_STAGES[idx + 1].value;
}
