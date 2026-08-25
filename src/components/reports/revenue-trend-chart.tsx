"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { DATAVIZ, CHART_GRID, CHART_MUTED_TEXT } from "@/lib/chart-colors";
import { formatCurrency } from "@/lib/utils";
import type { MonthlyRevenuePoint } from "@/lib/reports";

function compact(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `$${n}`;
}

export function RevenueTrendChart({ data }: { data: MonthlyRevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={CHART_GRID} />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: CHART_MUTED_TEXT, fontSize: 12 }}
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: CHART_MUTED_TEXT, fontSize: 12 }}
          tickFormatter={compact}
          width={48}
        />
        <Tooltip
          formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            fontSize: 12,
            color: "var(--color-popover-foreground)",
          }}
          cursor={{ stroke: CHART_GRID, strokeWidth: 1 }}
        />
        <Legend
          verticalAlign="top"
          height={28}
          align="right"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: CHART_MUTED_TEXT }}
        />
        <Line
          type="monotone"
          dataKey="invoiced"
          name="Invoiced"
          stroke={DATAVIZ[1]}
          strokeWidth={2}
          dot={{ r: 3, fill: DATAVIZ[1], strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="collected"
          name="Collected"
          stroke={DATAVIZ[2]}
          strokeWidth={2}
          dot={{ r: 3, fill: DATAVIZ[2], strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
