import type { Metadata } from "next";
import { FolderKanban } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { ProjectCard } from "@/components/project-card";
import { EmptyState } from "@/components/empty-state";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ProjectStatus } from "@/types/domain";

export const metadata: Metadata = { title: "Projects" };

const STATUS_TABS: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "needs_attention", label: "Needs Attention" },
  { value: "planning", label: "Planning" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export default async function ProjectsPage() {
  const user = await requireUser();
  const repo = getRepository();

  const [projects, clients, profiles] = await Promise.all([
    repo.listProjects(user.organizationId, user.role === "client" ? { profileId: user.id } : undefined),
    repo.listClients(user.organizationId),
    repo.listProfiles(user.organizationId),
  ]);

  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const withNames = await Promise.all(
    projects.map(async (p) => {
      const client = clientMap.get(p.client_id);
      const clientProfile = client ? profileMap.get(client.profile_id) : null;
      const projectMembers = await repo.listProjectMembers(p.id);
      const memberNames = projectMembers
        .map((m) => profileMap.get(m.profile_id)?.full_name)
        .filter(Boolean) as string[];
      const health = await repo.getProjectHealth(p.id);
      return { project: p, clientName: clientProfile?.full_name ?? client?.company_name ?? undefined, memberNames, health };
    })
  );

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} project${projects.length === 1 ? "" : "s"}`}
        actions={
          user.role === "admin" ? (
            <NewProjectDialog
              clients={clients.map((c) => ({
                id: c.id,
                name: profileMap.get(c.profile_id)?.full_name ?? c.company_name ?? c.id,
              }))}
            />
          ) : undefined
        }
      />
      <div className="px-4 lg:px-6 pb-10">
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            {STATUS_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {STATUS_TABS.map((t) => {
            const filtered = t.value === "all" ? withNames : withNames.filter((w) => w.project.status === t.value);
            return (
              <TabsContent key={t.value} value={t.value}>
                {filtered.length === 0 ? (
                  <EmptyState
                    icon={FolderKanban}
                    title="No projects here"
                    description={
                      t.value === "all"
                        ? "Create your first project to start tracking work."
                        : "Nothing in this status right now."
                    }
                  />
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(({ project, clientName, memberNames, health }) => (
                      <ProjectCard key={project.id} project={project} clientName={clientName} memberNames={memberNames} health={health} />
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
