import { GlobalSearch } from "@/components/global-search";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { QuickAddModal } from "@/components/quick-add/quick-add-modal";
import { ProjectSwitcher } from "./project-switcher";
import { ThemeToggle } from "./theme-toggle";
import type { Notification, Project } from "@/types/domain";

export function TopNav({
  projects,
  notifications,
  profileId,
  quickAddProjects,
  quickAddMembers,
  quickAddClients,
}: {
  projects: Project[];
  notifications: Notification[];
  profileId: string;
  quickAddProjects: { id: string; name: string }[];
  quickAddMembers: { id: string; name: string }[];
  quickAddClients: { id: string; name: string }[];
}) {
  return (
    <header className="sticky top-0 z-30 h-14 flex items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 lg:px-6">
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <GlobalSearch />
      </div>
      <ProjectSwitcher projects={projects} />
      <QuickAddModal projects={quickAddProjects} members={quickAddMembers} clients={quickAddClients} />
      <ThemeToggle />
      <NotificationsDropdown notifications={notifications} profileId={profileId} />
    </header>
  );
}
