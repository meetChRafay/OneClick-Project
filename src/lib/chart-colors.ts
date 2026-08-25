import type { StatusTone } from "@/lib/reports";

// CSS custom properties, resolved live by the browser — so charts stay
// correct across light/dark without any JS-side theme detection. See the
// --dataviz-* and --status-* tokens in src/app/globals.css.

export const DATAVIZ = {
  1: "var(--color-dataviz-1)",
  2: "var(--color-dataviz-2)",
  3: "var(--color-dataviz-3)",
  4: "var(--color-dataviz-4)",
  5: "var(--color-dataviz-5)",
} as const;

export const STATUS_TONE_COLOR: Record<StatusTone, string> = {
  neutral: "var(--color-status-neutral)",
  info: "var(--color-status-info)",
  warning: "var(--color-status-warning)",
  danger: "var(--color-status-danger)",
  success: "var(--color-status-success)",
};

export const CHART_GRID = "var(--color-border)";
export const CHART_MUTED_TEXT = "var(--color-muted-foreground)";
