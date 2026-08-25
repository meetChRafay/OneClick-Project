import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { getAccessibleProjectIds } from "@/lib/authz";
import { PageHeader } from "@/components/page-header";
import { IssueCard } from "@/components/issue-card";
import { EmptyState } from "@/components/empty-state";
import { NewIssueDialog } from "@/components/issues/new-issue-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const metadata: Metadata = { title: "Issues" };

export default async function IssuesPage() {
  const user = await requireUser();
  const repo = getRepository();

  const scope = await getAccessibleProjectIds(repo, user);
  const [allIssues, projects, profiles] = await Promise.all([
    repo.listIssues(user.organizationId),
    repo.listProjects(user.organizationId, user.role === "client" ? { profileId: user.id } : undefined),
    repo.listProfiles(user.organizationId),
  ]);

  const issues = allIssues.filter((i) => !scope || scope.has(i.project_id));
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));
  const profileMap = new Map(profiles.map((p) => [p.id, p.full_name]));
  const admins = profiles.filter((p) => p.role === "admin");

  const open = issues.filter((i) => i.status === "open" || i.status === "in_progress" || i.status === "waiting");
  const resolved = issues.filter((i) => i.status === "resolved" || i.status === "closed");

  const tabs = [
    { value: "open", label: "Open", items: open },
    { value: "resolved", label: "Resolved", items: resolved },
    { value: "all", label: "All", items: issues },
  ];

  return (
    <div>
      <PageHeader
        title="Issues"
        subtitle={`${open.length} open`}
        actions={
          <NewIssueDialog
            projects={projects.map((p) => ({ id: p.id, name: p.name }))}
            members={admins.map((a) => ({ id: a.id, name: a.full_name }))}
          />
        }
      />
      <div className="px-4 lg:px-6 pb-10">
        <Tabs defaultValue="open">
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
                <EmptyState icon={AlertTriangle} title="Nothing here" description="No issues in this view." />
              ) : (
                t.items.map((i) => (
                  <IssueCard
                    key={i.id}
                    issue={i}
                    projectName={projectMap.get(i.project_id)}
                    assigneeName={i.assignee_id ? profileMap.get(i.assignee_id) : null}
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
