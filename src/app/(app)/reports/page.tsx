import type { Metadata } from "next";
import { DollarSign, FolderKanban, CheckCircle2, TrendingUp } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { SummaryCard } from "@/components/summary-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueTrendChart } from "@/components/reports/revenue-trend-chart";
import { RevenueByClientChart } from "@/components/reports/revenue-by-client-chart";
import { StatusBreakdownBar } from "@/components/reports/status-breakdown-bar";
import { formatCurrency } from "@/lib/utils";
import { monthlyRevenue, revenueByClient, taskStatusBreakdown, projectHealthBreakdown } from "@/lib/reports";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const user = await requireAdmin();
  const repo = getRepository();

  const [projects, tasks, payments, clients] = await Promise.all([
    repo.listProjects(user.organizationId),
    repo.listTasks(user.organizationId),
    repo.listPayments(user.organizationId),
    repo.listClients(user.organizationId),
  ]);

  const healths = await Promise.all(projects.map((p) => repo.getProjectHealth(p.id)));

  const totalCollected = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const outstanding = payments.filter((p) => p.status === "sent" || p.status === "overdue").reduce((s, p) => s + p.amount, 0);
  const activeProjects = projects.filter((p) => p.status === "active" || p.status === "needs_attention").length;
  const activeTasks = tasks.filter((t) => t.status !== "cancelled");
  const completionRate = activeTasks.length
    ? Math.round((activeTasks.filter((t) => t.status === "completed").length / activeTasks.length) * 100)
    : 0;

  const revenueTrend = monthlyRevenue(payments);
  const topClients = revenueByClient(payments, clients);
  const taskBreakdown = taskStatusBreakdown(tasks);
  const healthBreakdown = projectHealthBreakdown(healths.map((h) => h.health));

  return (
    <div>
      <PageHeader title="Reports" subtitle="Business performance across every project." />
      <div className="px-4 lg:px-6 pb-10 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard label="Total Collected" value={formatCurrency(totalCollected)} icon={CheckCircle2} tone="success" href="/payments" />
          <SummaryCard label="Outstanding" value={formatCurrency(outstanding)} icon={DollarSign} tone="warning" href="/payments" />
          <SummaryCard label="Active Projects" value={activeProjects} icon={FolderKanban} tone="info" href="/projects" />
          <SummaryCard label="Task Completion" value={`${completionRate}%`} icon={TrendingUp} tone="neutral" href="/tasks" />
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <Card className="p-0 lg:col-span-2">
            <CardHeader className="pt-5 pb-0">
              <CardTitle className="text-sm">Revenue — last 6 months</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 pb-4">
              <RevenueTrendChart data={revenueTrend} />
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardHeader className="pt-5 pb-0">
              <CardTitle className="text-sm">Revenue by client</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-5">
              {topClients.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments collected yet.</p>
              ) : (
                <RevenueByClientChart data={topClients} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <Card className="p-0">
            <CardHeader className="pt-5 pb-0">
              <CardTitle className="text-sm">Task pipeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 pb-5">
              <StatusBreakdownBar segments={taskBreakdown} />
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardHeader className="pt-5 pb-0">
              <CardTitle className="text-sm">Project health</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 pb-5">
              <StatusBreakdownBar segments={healthBreakdown} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
