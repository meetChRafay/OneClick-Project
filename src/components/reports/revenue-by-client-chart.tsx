"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from "recharts";
import { DATAVIZ, CHART_GRID, CHART_MUTED_TEXT } from "@/lib/chart-colors";
import { formatCurrency } from "@/lib/utils";
import type { ClientRevenuePoint } from "@/lib/reports";

export function RevenueByClientChart({ data }: { data: ClientRevenuePoint[] }) {
  const height = Math.max(120, data.length * 44);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke={CHART_GRID} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          width={120}
          tick={{ fill: CHART_MUTED_TEXT, fontSize: 12 }}
        />
        <Tooltip
          formatter={(value) => [formatCurrency(Number(value)), "Collected"]}
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            fontSize: 12,
            color: "var(--color-popover-foreground)",
          }}
          cursor={{ fill: "var(--color-accent)" }}
        />
        <Bar dataKey="collected" name="Collected" fill={DATAVIZ[1]} radius={[0, 4, 4, 0]} maxBarSize={22}>
          <LabelList
            dataKey="collected"
            position="right"
            formatter={(v: React.ReactNode) => formatCurrency(Number(v))}
            style={{ fill: "var(--color-foreground)", fontSize: 12, fontWeight: 500 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
