import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { getAccessibleProjectIds } from "@/lib/authz";
import { PageHeader } from "@/components/page-header";
import { ApprovalCard } from "@/components/approval-card";
import { EmptyState } from "@/components/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const metadata: Metadata = { title: "Approvals" };

export default async function ApprovalsPage() {
  const user = await requireUser();
  const repo = getRepository();

  const scope = await getAccessibleProjectIds(repo, user);
  const [allApprovals, projects] = await Promise.all([
    repo.listApprovals(user.organizationId),
    repo.listProjects(user.organizationId, user.role === "client" ? { profileId: user.id } : undefined),
  ]);

  const approvals = allApprovals.filter((a) => !scope || scope.has(a.project_id));
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  const waiting = approvals.filter((a) => a.status === "waiting_client");
  const changesRequested = approvals.filter((a) => a.status === "changes_requested");
  const approved = approvals.filter((a) => a.status === "approved");

  const tabs = [
    { value: "waiting", label: "Waiting for Approval", items: waiting },
    { value: "changes", label: "Changes Requested", items: changesRequested },
    { value: "approved", label: "Approved", items: approved },
    { value: "all", label: "All", items: approvals },
  ];

  return (
    <div>
      <PageHeader title="Approvals" subtitle={`${approvals.length} total`} />
      <div className="px-4 lg:px-6 pb-10">
        <Tabs defaultValue="waiting">
          <TabsList className="mb-4">
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label} ({t.items.length})
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((t) => (
            <TabsContent key={t.value} value={t.value} className="space-y-2.5">
              {t.items.length === 0 ? (
                <EmptyState icon={ClipboardCheck} title="Nothing here" description="No approvals in this view." />
              ) : (
                t.items.map((a) => (
                  <ApprovalCard
                    key={a.id}
                    approval={a}
                    projectName={projectMap.get(a.project_id)}
                    canDecide={user.role === "client" && a.status === "waiting_client"}
                  />
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
