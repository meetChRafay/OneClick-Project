import type { Client, Payment, ProjectHealth, Task } from "@/types/domain";

// ============================================================================
// Pure aggregation helpers for the Reports page (src/app/(app)/reports).
// Kept separate from the page component so the bucketing rules are easy to
// find and adjust in one place, and so the chart components stay dumb
// (data in, pixels out).
// ============================================================================

const MONTH_LABEL = new Intl.DateTimeFormat("en-US", { month: "short" });

function monthKey(dateOnly: string) {
  return dateOnly.slice(0, 7); // "YYYY-MM"
}

export interface MonthlyRevenuePoint {
  month: string; // short label, e.g. "Jun"
  monthKey: string; // "2026-06", for stable sort/keys
  invoiced: number;
  collected: number;
}

/** Last `months` calendar months (oldest first), summing invoiced vs. actually collected amounts. */
export function monthlyRevenue(payments: Payment[], months = 6, now = new Date()): MonthlyRevenuePoint[] {
  const buckets: MonthlyRevenuePoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({ month: MONTH_LABEL.format(d), monthKey: key, invoiced: 0, collected: 0 });
  }
  const byKey = new Map(buckets.map((b) => [b.monthKey, b]));

  for (const p of payments) {
    if (p.status !== "cancelled") {
      const bucket = byKey.get(monthKey(p.issued_date));
      if (bucket) bucket.invoiced += p.amount;
    }
    if (p.status === "paid" && p.paid_date) {
      const bucket = byKey.get(monthKey(p.paid_date));
      if (bucket) bucket.collected += p.amount;
    }
  }
  return buckets;
}

export interface ClientRevenuePoint {
  clientId: string;
  name: string;
  collected: number;
}

/** Top clients by amount actually collected (paid invoices only). */
export function revenueByClient(payments: Payment[], clients: Client[], limit = 6): ClientRevenuePoint[] {
  const nameById = new Map(clients.map((c) => [c.id, c.company_name || "Unnamed client"]));
  const totals = new Map<string, number>();
  for (const p of payments) {
    if (p.status !== "paid") continue;
    totals.set(p.client_id, (totals.get(p.client_id) ?? 0) + p.amount);
  }
  return [...totals.entries()]
    .map(([clientId, collected]) => ({ clientId, name: nameById.get(clientId) ?? "Unknown client", collected }))
    .sort((a, b) => b.collected - a.collected)
    .slice(0, limit);
}

export type StatusTone = "neutral" | "info" | "warning" | "danger" | "success";

export interface BreakdownSegment {
  key: string;
  label: string;
  value: number;
  tone: StatusTone;
}

const TASK_BUCKETS: { key: string; label: string; tone: StatusTone; statuses: Task["status"][] }[] = [
  { key: "todo", label: "To Do", tone: "neutral", statuses: ["not_started"] },
  { key: "in_progress", label: "In Progress", tone: "info", statuses: ["in_progress", "internal_review", "final_approval"] },
  { key: "needs_client", label: "Needs Client", tone: "warning", statuses: ["client_review", "waiting_client", "waiting_me"] },
  { key: "blocked", label: "Blocked", tone: "danger", statuses: ["corrections_required", "blocked"] },
  { key: "completed", label: "Completed", tone: "success", statuses: ["completed"] },
];

/** Buckets active tasks into the 5 lanes shown as status badges elsewhere in the app. Cancelled tasks are excluded — they're not part of the active pipeline. */
export function taskStatusBreakdown(tasks: Task[]): BreakdownSegment[] {
  return TASK_BUCKETS.map((b) => ({
    key: b.key,
    label: b.label,
    tone: b.tone,
    value: tasks.filter((t) => b.statuses.includes(t.status)).length,
  }));
}

const HEALTH_CONFIG: Record<ProjectHealth, { label: string; tone: StatusTone }> = {
  healthy: { label: "Healthy", tone: "success" },
  needs_attention: { label: "Needs Attention", tone: "warning" },
  at_risk: { label: "At Risk", tone: "danger" },
};

export function projectHealthBreakdown(healths: ProjectHealth[]): BreakdownSegment[] {
  return (Object.keys(HEALTH_CONFIG) as ProjectHealth[]).map((h) => ({
    key: h,
    label: HEALTH_CONFIG[h].label,
    tone: HEALTH_CONFIG[h].tone,
    value: healths.filter((x) => x === h).length,
  }));
}
