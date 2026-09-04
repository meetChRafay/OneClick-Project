import { notFound } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, Clock3, Lock, FolderKanban } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-avatar";
import { ProjectCard } from "@/components/project-card";
import { ProjectHealthBadge } from "@/components/project-health-badge";
import { EmptyState } from "@/components/empty-state";
import { ClientNotesEditor } from "@/components/clients/client-notes-editor";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteClientAction } from "@/lib/actions/clients";
import { timezoneAbbrev } from "@/lib/timezones";
import { formatDate } from "@/lib/utils";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireAdmin();
  const repo = getRepository();

  const client = await repo.getClient(id);
  if (!client || client.organization_id !== user.organizationId) notFound();

  const [profile, projects] = await Promise.all([
    repo.getProfile(client.profile_id),
    repo.listProjects(user.organizationId, { clientId: client.id }),
  ]);

  const healths = await Promise.all(projects.map((p) => repo.getProjectHealth(p.id)));

  const boundDeleteClient = async () => {
    "use server";
    await deleteClientAction(client.id);
  };

  return (
    <div>
      <PageHeader
        title={profile?.full_name ?? "Pending invite"}
        subtitle={client.company_name ?? undefined}
        actions={
          <ConfirmDeleteButton
            label="client"
            itemName={profile?.full_name ?? client.company_name ?? "this client"}
            warning={
              projects.length > 0
                ? `This will also permanently delete all ${projects.length} of their project${projects.length > 1 ? "s" : ""} (and everything in them — tasks, files, etc.). Their login is not deleted.`
                : "Their login is not deleted, only their client record."
            }
            action={boundDeleteClient}
            redirectTo="/clients"
          />
        }
      />
      <div className="px-4 lg:px-6 pb-10 space-y-5 max-w-4xl">
        <Card className="p-0">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-4">
              <UserAvatar name={profile?.full_name ?? "?"} id={client.profile_id} size="lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-medium text-sm">{profile?.full_name ?? "Invitation pending"}</h2>
                  {profile && !profile.onboarding_completed && (
                    <Badge variant="warning" className="text-[10px]">
                      <Clock3 className="size-2.5" /> Invitation pending
                    </Badge>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-muted-foreground">
                  {profile?.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="size-3.5 shrink-0" /> {profile.email}
                    </div>
                  )}
                  {profile?.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="size-3.5 shrink-0" /> {profile.phone}
                    </div>
                  )}
                  {profile?.timezone && (
                    <div className="flex items-center gap-1.5">
                      <Clock3 className="size-3.5 shrink-0" /> {profile.timezone} ({timezoneAbbrev(profile.timezone)})
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    Client since {formatDate(client.created_at, { month: "long", year: "numeric" })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="pt-5 pb-0">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Lock className="size-3.5 text-muted-foreground" /> Internal notes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 pb-5">
            <ClientNotesEditor clientId={client.id} initialNotes={client.notes_internal ?? ""} />
          </CardContent>
        </Card>

        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
            <FolderKanban className="size-4 text-muted-foreground" />
            Projects ({projects.length})
          </h3>
          {projects.length === 0 ? (
            <EmptyState icon={FolderKanban} title="No projects yet" description="This client isn't on any project yet." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 items-start">
              {projects.map((p, idx) => (
                <div key={p.id} className="space-y-2 min-w-0">
                  <ProjectCard project={p} health={healths[idx]} />
                  <ProjectHealthBadge health={healths[idx]} className="w-full flex-wrap h-auto" />
                </div>
              ))}
            </div>
          )}
        </div>

        <Link href="/clients" className="text-sm text-muted-foreground hover:underline inline-block">
          ← Back to all clients
        </Link>
      </div>
    </div>
  );
}
