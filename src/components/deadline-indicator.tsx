import { cn, formatDate, isDueThisWeek, isDueToday, isDueTomorrow, isOverdue, relativeTime } from "@/lib/utils";

export function DeadlineIndicator({
  deadline,
  completed,
  className,
  showRelative = true,
}: {
  deadline?: string | null;
  completed?: boolean;
  className?: string;
  showRelative?: boolean;
}) {
  if (!deadline) {
    return <span className={cn("text-xs text-muted-foreground", className)}>No deadline</span>;
  }

  if (completed) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs text-status-success", className)}>
        <span className="size-1.5 rounded-full bg-status-success" />
        Completed
      </span>
    );
  }

  const overdue = isOverdue(deadline);
  const today = isDueToday(deadline);
  const tomorrow = isDueTomorrow(deadline);
  const thisWeek = isDueThisWeek(deadline);

  let color = "bg-status-neutral";
  let textColor = "text-muted-foreground";
  let label = formatDate(deadline);

  if (overdue) {
    color = "bg-status-danger";
    textColor = "text-status-danger";
    label = `Due ${relativeTime(deadline)}`;
  } else if (today) {
    color = "bg-status-warning";
    textColor = "text-status-warning";
    label = `Due today, ${formatDate(deadline, { hour: "numeric", minute: "2-digit" })}`;
  } else if (tomorrow) {
    color = "bg-status-info";
    textColor = "text-status-info";
    label = "Due tomorrow";
  } else if (thisWeek) {
    color = "bg-status-success";
    textColor = "text-status-success";
    label = `Due ${formatDate(deadline, { weekday: "long" })}`;
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", textColor, className)}>
      <span className={cn("size-1.5 rounded-full", color)} />
      {showRelative ? label : formatDate(deadline)}
    </span>
  );
}
