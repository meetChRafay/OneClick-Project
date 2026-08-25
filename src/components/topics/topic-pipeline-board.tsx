"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PriorityBadge } from "@/components/priority-badge";
import { UserAvatar } from "@/components/user-avatar";
import { PIPELINE_STAGES } from "@/lib/workflow";
import { TopicDetailDialog } from "./topic-detail-dialog";
import type { Topic } from "@/types/domain";

export function TopicPipelineBoard({
  topics,
  profileMap,
  projectMap,
  canEdit,
}: {
  topics: Topic[];
  profileMap: Map<string, string>;
  projectMap: Map<string, string>;
  canEdit: boolean;
}) {
  const [openTopic, setOpenTopic] = useState<Topic | null>(null);

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const items = topics.filter((t) => t.pipeline_stage === stage.value);
          return (
            <div key={stage.value} className="w-64 shrink-0">
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{stage.label}</h3>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((topic) => (
                  <Card
                    key={topic.id}
                    className="p-0 cursor-pointer hover:shadow-md hover:border-ring/40 transition-all"
                    onClick={() => setOpenTopic(topic)}
                  >
                    <div className="p-3 space-y-2">
                      <div className="text-sm font-medium leading-snug">{topic.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{projectMap.get(topic.project_id)}</div>
                      <div className="flex items-center justify-between">
                        <PriorityBadge priority={topic.priority} />
                        {topic.assignee_id && <UserAvatar name={profileMap.get(topic.assignee_id) ?? "?"} size="sm" />}
                      </div>
                    </div>
                  </Card>
                ))}
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">Empty</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {openTopic && (
        <TopicDetailDialog
          topic={openTopic}
          assigneeName={openTopic.assignee_id ? profileMap.get(openTopic.assignee_id) : null}
          projectName={projectMap.get(openTopic.project_id)}
          canEdit={canEdit}
          open={!!openTopic}
          onOpenChange={(o) => !o && setOpenTopic(null)}
        />
      )}
    </>
  );
}
