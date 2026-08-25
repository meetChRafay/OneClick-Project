import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/priority-badge";
import { UserAvatar } from "@/components/user-avatar";
import { formatDate } from "@/lib/utils";
import type { Topic } from "@/types/domain";

const STATUS_LABEL: Record<Topic["status"], string> = {
  idea: "Idea",
  ready_to_start: "Ready to Start",
  in_progress: "In Progress",
  in_review: "In Review",
  published: "Published",
};

const STATUS_VARIANT: Record<Topic["status"], "neutral" | "info" | "warning" | "success"> = {
  idea: "neutral",
  ready_to_start: "info",
  in_progress: "info",
  in_review: "warning",
  published: "success",
};

const STAGE_LABEL: Record<Topic["workflow_stage"], string> = {
  topic_idea: "Topic Idea",
  topic_approved: "Topic Approved",
  research: "Research",
  script: "Script",
  script_review: "Script Review",
  voiceover: "Voiceover",
  visual_production: "Visual Production",
  editing: "Editing",
  internal_review: "Internal Review",
  client_review: "Client Review",
  corrections: "Corrections",
  final_approval: "Final Approval",
  thumbnail: "Thumbnail",
  seo: "SEO",
  upload: "Upload",
  published: "Published",
};

export function TopicRow({ topic, assigneeName }: { topic: Topic; assigneeName?: string | null }) {
  return (
    <Card className="p-0">
      <div className="p-4 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">{topic.title}</div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
            <Badge variant={STATUS_VARIANT[topic.status]}>{STATUS_LABEL[topic.status]}</Badge>
            <Badge variant="outline">{STAGE_LABEL[topic.workflow_stage]}</Badge>
            <PriorityBadge priority={topic.priority} />
            {topic.expected_start && (
              <span className="text-xs text-muted-foreground">Start {formatDate(topic.expected_start)}</span>
            )}
          </div>
        </div>
        {assigneeName && <UserAvatar name={assigneeName} size="sm" />}
      </div>
    </Card>
  );
}
