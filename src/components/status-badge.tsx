import { Badge } from "@/components/ui/badge";
import type { ApprovalStatus, IssueStatus, PaymentStatus, ProjectStatus, TaskStatus } from "@/types/domain";

const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; variant: "neutral" | "info" | "warning" | "danger" | "success" }> = {
  not_started: { label: "Not Started", variant: "neutral" },
  in_progress: { label: "In Progress", variant: "info" },
  internal_review: { label: "Internal Review", variant: "info" },
  client_review: { label: "Client Review", variant: "warning" },
  waiting_client: { label: "Waiting for Client", variant: "warning" },
  waiting_me: { label: "Waiting for Me", variant: "warning" },
  corrections_required: { label: "Corrections Required", variant: "danger" },
  blocked: { label: "Blocked", variant: "danger" },
  final_approval: { label: "Final Approval", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "neutral" },
};

export function TaskStatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  const cfg = TASK_STATUS_CONFIG[status];
  return (
    <Badge variant={cfg.variant} className={className}>
      {cfg.label}
    </Badge>
  );
}

const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; variant: "neutral" | "info" | "warning" | "danger" | "success" }> = {
  planning: { label: "Planning", variant: "neutral" },
  active: { label: "Active", variant: "info" },
  needs_attention: { label: "Needs Attention", variant: "warning" },
  on_hold: { label: "On Hold", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  archived: { label: "Archived", variant: "neutral" },
};

export function ProjectStatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  const cfg = PROJECT_STATUS_CONFIG[status];
  return (
    <Badge variant={cfg.variant} className={className}>
      {cfg.label}
    </Badge>
  );
}

const ISSUE_STATUS_CONFIG: Record<IssueStatus, { label: string; variant: "neutral" | "info" | "warning" | "danger" | "success" }> = {
  open: { label: "Open", variant: "danger" },
  in_progress: { label: "In Progress", variant: "info" },
  waiting: { label: "Waiting", variant: "warning" },
  resolved: { label: "Resolved", variant: "success" },
  closed: { label: "Closed", variant: "neutral" },
};

export function IssueStatusBadge({ status, className }: { status: IssueStatus; className?: string }) {
  const cfg = ISSUE_STATUS_CONFIG[status];
  return (
    <Badge variant={cfg.variant} className={className}>
      {cfg.label}
    </Badge>
  );
}

const APPROVAL_STATUS_CONFIG: Record<ApprovalStatus, { label: string; variant: "neutral" | "info" | "warning" | "danger" | "success" }> = {
  waiting_client: { label: "Waiting for Client Approval", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  changes_requested: { label: "Changes Requested", variant: "danger" },
};

export function ApprovalStatusBadge({ status, className }: { status: ApprovalStatus; className?: string }) {
  const cfg = APPROVAL_STATUS_CONFIG[status];
  return (
    <Badge variant={cfg.variant} className={className}>
      {cfg.label}
    </Badge>
  );
}

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; variant: "neutral" | "info" | "warning" | "danger" | "success" }> = {
  draft: { label: "Draft", variant: "neutral" },
  sent: { label: "Sent", variant: "info" },
  paid: { label: "Paid", variant: "success" },
  overdue: { label: "Overdue", variant: "danger" },
  cancelled: { label: "Cancelled", variant: "neutral" },
};

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  const cfg = PAYMENT_STATUS_CONFIG[status];
  return (
    <Badge variant={cfg.variant} className={className}>
      {cfg.label}
    </Badge>
  );
}
