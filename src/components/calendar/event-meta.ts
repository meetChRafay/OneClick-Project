import { CheckSquare, Users, Eye, Rocket, Flag, CircleDot, type LucideIcon } from "lucide-react";
import type { CalItemType } from "./types";

export const EVENT_TYPE_META: Record<CalItemType, { label: string; icon: LucideIcon; dot: string; chip: string }> = {
  task_deadline: {
    label: "Task deadline",
    icon: CheckSquare,
    dot: "bg-chart-4",
    chip: "bg-chart-4/15 text-chart-4",
  },
  meeting: {
    label: "Meeting",
    icon: Users,
    dot: "bg-chart-1",
    chip: "bg-chart-1/15 text-chart-1",
  },
  review_session: {
    label: "Review session",
    icon: Eye,
    dot: "bg-chart-2",
    chip: "bg-chart-2/15 text-chart-2",
  },
  publish_date: {
    label: "Publish date",
    icon: Rocket,
    dot: "bg-status-success",
    chip: "bg-status-success-bg text-status-success",
  },
  milestone: {
    label: "Milestone",
    icon: Flag,
    dot: "bg-chart-5",
    chip: "bg-chart-5/15 text-chart-5",
  },
  availability_block: {
    label: "Availability",
    icon: CircleDot,
    dot: "bg-status-neutral",
    chip: "bg-status-neutral-bg text-status-neutral",
  },
};
