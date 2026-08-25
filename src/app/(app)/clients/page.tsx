import type { Metadata } from "next";
import Link from "next/link";
import { Users, Mail, FolderKanban, Clock } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-avatar";
import { InviteClientDialog } from "@/components/clients/invite-client-dialog";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const user = await requireAdmin();
  const repo = getRepository();

  const [clients, projects, profiles] = await Promise.all([
    repo.listClients(user.organizationId),
    repo.listProjects(user.organizationId),
    repo.listProfiles(user.organizationId),
  ]);

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const rows = clients.map((client) => {
    const profile = profileMap.get(client.profile_id);
    const clientProjects = projects.filter((p) => p.client_id === client.id);
    return { client, profile, projects: clientProjects };
  });

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} client${clients.length === 1 ? "" : "s"}`}
        actions={
          <InviteClientDialog projects={projects.map((p) => ({ id: p.id, name: p.name }))} />
        }
      />
      <div className="px-4 lg:px-6 pb-10">
        {rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="Invite your first client to give them access to their projects."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rows.map(({ client, profile, projects: clientProjects }) => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <Card className="p-4 h-full hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="flex items-start gap-3">
                    <UserAvatar name={profile?.full_name ?? "?"} id={client.profile_id} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-medium text-sm truncate">{profile?.full_name ?? "Pending invite"}</h3>
                        {profile && !profile.onboarding_completed && (
                          <Badge variant="warning" className="text-[10px] shrink-0">
                            <Clock className="size-2.5" /> Pending
                          </Badge>
                        )}
                      </div>
                      {client.company_name && (
                        <p className="text-xs text-muted-foreground truncate">{client.company_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3.5 space-y-1.5 text-xs text-muted-foreground">
                    {profile?.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="size-3 shrink-0" /> {profile.email}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <FolderKanban className="size-3 shrink-0" />
                      {clientProjects.length} project{clientProjects.length === 1 ? "" : "s"}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
