import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { NotificationSettingsForm } from "@/components/settings/notification-settings-form";
import { IntegrationsPanel } from "@/components/settings/integrations-panel";
import { OrganizationSettingsForm } from "@/components/settings/organization-settings-form";
import { OnboardingChecklist, type OnboardingItem } from "@/components/settings/onboarding-checklist";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const repo = getRepository();

  const profile = await repo.getProfile(user.id);
  if (!profile) notFound();

  const isAdmin = user.role === "admin";

  const [organization, integrations, clients, projects, profiles] = await Promise.all([
    repo.getOrganization(user.organizationId),
    repo.listIntegrations(user.organizationId, user.id),
    isAdmin ? repo.listClients(user.organizationId) : Promise.resolve([]),
    isAdmin ? repo.listProjects(user.organizationId) : Promise.resolve([]),
    isAdmin ? repo.listProfiles(user.organizationId) : Promise.resolve([]),
  ]);

  const driveConnected = integrations.some((i) => i.provider === "google_drive" && i.connected);

  const onboardingItems: OnboardingItem[] = [
    { label: "Create your first project", done: projects.length > 0, href: "/projects" },
    { label: "Invite your first client", done: clients.length > 0, href: "/clients" },
    { label: "Connect Google Drive", done: driveConnected, href: "/settings" },
  ];

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your profile, notifications and integrations" />
      <div className="px-4 lg:px-6 pb-10">
        {isAdmin && !profile.onboarding_completed && <OnboardingChecklist items={onboardingItems} />}
        <Tabs defaultValue="profile">
          <TabsList className="mb-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            {isAdmin && <TabsTrigger value="integrations">Integrations</TabsTrigger>}
            {isAdmin && <TabsTrigger value="organization">Organization</TabsTrigger>}
          </TabsList>
          <TabsContent value="profile">
            <ProfileSettingsForm profile={profile} />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationSettingsForm initialPrefs={profile.notification_prefs} />
          </TabsContent>
          {isAdmin && (
            <TabsContent value="integrations">
              <IntegrationsPanel integrations={integrations} currentUserId={user.id} />
            </TabsContent>
          )}
          {isAdmin && (
            <TabsContent value="organization">
              <OrganizationSettingsForm
                orgName={organization?.name ?? ""}
                team={profiles
                  .filter((p) => p.role === "admin")
                  .map((p) => ({ id: p.id, name: p.full_name, title: p.title }))}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
