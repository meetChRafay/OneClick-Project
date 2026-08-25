import Link from "next/link";
import { Card } from "@/components/ui/card";
import { IssueStatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { UserAvatar } from "@/components/user-avatar";
import { DeadlineIndicator } from "@/components/deadline-indicator";
import type { Issue } from "@/types/domain";

const PRIORITY_EMOJI: Record<Issue["priority"], string> = {
  urgent: "\u{1F534}",
  high: "\u{1F534}",
  medium: "\u{1F7E1}",
  low: "⚪",
};

export function IssueCard({
  issue,
  projectName,
  assigneeName,
}: {
  issue: Issue;
  projectName?: string;
  assigneeName?: string | null;
}) {
  return (
    <Link href={`/issues/${issue.id}`}>
      <Card className="p-0 hover:shadow-md transition-shadow">
        <div className="p-4 flex items-start gap-3">
          <span className="text-base leading-none mt-0.5">{PRIORITY_EMOJI[issue.priority]}</span>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm truncate">{issue.title}</div>
            {projectName && <div className="text-xs text-muted-foreground mt-0.5 truncate">{projectName}</div>}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
              <IssueStatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
              <DeadlineIndicator deadline={issue.deadline} completed={issue.status === "resolved" || issue.status === "closed"} />
            </div>
          </div>
          {assigneeName && <UserAvatar name={assigneeName} size="sm" />}
        </div>
      </Card>
    </Link>
  );
}
