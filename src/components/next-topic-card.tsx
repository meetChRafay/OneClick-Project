import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge } from "@/components/priority-badge";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-avatar";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import type { Topic } from "@/types/domain";

const STATUS_LABEL: Record<Topic["status"], string> = {
  idea: "Idea",
  ready_to_start: "Ready to Start",
  in_progress: "In Progress",
  in_review: "In Review",
  published: "Published",
};

export function NextTopicCard({ topic, assigneeName }: { topic: Topic | null; assigneeName?: string | null }) {
  return (
    <Card className="p-0">
      <CardHeader className="pt-5 pb-0">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <Sparkles className="size-3.5 text-primary" />
          Next Topic
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-5">
        {!topic ? (
          <EmptyState
            icon={Sparkles}
            title="No upcoming topic yet"
            description="Add a topic idea to see it here."
            className="py-6 border-none"
          />
        ) : (
          <div className="space-y-3">
            <Link href="/topics" className="font-medium hover:underline block">
              {topic.title}
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">{STATUS_LABEL[topic.status]}</Badge>
              <PriorityBadge priority={topic.priority} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="text-muted-foreground">
                {topic.expected_start ? `Expected start ${formatDate(topic.expected_start)}` : "No start date yet"}
              </div>
              {assigneeName && (
                <div className="flex items-center gap-1.5">
                  <UserAvatar name={assigneeName} size="sm" />
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
