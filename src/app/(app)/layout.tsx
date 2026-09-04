import { requireUser } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { Sidebar } from "@/components/shell/sidebar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { TopNav } from "@/components/shell/topnav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const repo = getRepository();

  const [projects, profiles, clients, notifications] = await Promise.all([
    repo.listProjects(user.organizationId, user.role === "client" ? { profileId: user.id } : undefined),
    repo.listProfiles(user.organizationId),
    repo.listClients(user.organizationId),
    repo.listNotifications(user.id),
  ]);

  const admins = profiles.filter((p) => p.role === "admin");
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const quickAddClients = clients.map((c) => ({
    id: c.id,
    name: c.company_name || profileById.get(c.profile_id)?.full_name || "Unnamed client",
  }));

  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} userName={user.fullName} userEmail={user.email} userId={user.id} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav
          role={user.role}
          projects={projects}
          notifications={notifications}
          profileId={user.id}
          quickAddProjects={projects.map((p) => ({ id: p.id, name: p.name }))}
          quickAddMembers={admins.map((a) => ({ id: a.id, name: a.full_name }))}
          quickAddClients={quickAddClients}
        />
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      </div>
      <MobileNav role={user.role} userName={user.fullName} userEmail={user.email} userId={user.id} />
    </div>
  );
}
