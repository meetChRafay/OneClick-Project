import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  CalendarDays,
  Clock,
  Sparkles,
  FolderOpen,
  AlertTriangle,
  MessagesSquare,
  ClipboardCheck,
  History,
  Users,
  Settings,
  DollarSign,
} from "lucide-react";
import type { UserRole } from "@/types/domain";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "client"] },
  { label: "Projects", href: "/projects", icon: FolderKanban, roles: ["admin", "client"] },
  { label: "Tasks", href: "/tasks", icon: CheckSquare, roles: ["admin", "client"] },
  { label: "Calendar", href: "/calendar", icon: CalendarDays, roles: ["admin", "client"] },
  { label: "Availability", href: "/availability", icon: Clock, roles: ["admin", "client"] },
  { label: "Topics", href: "/topics", icon: Sparkles, roles: ["admin", "client"] },
  { label: "Files", href: "/files", icon: FolderOpen, roles: ["admin", "client"] },
  { label: "Issues", href: "/issues", icon: AlertTriangle, roles: ["admin", "client"] },
  { label: "Communication", href: "/communication", icon: MessagesSquare, roles: ["admin", "client"] },
  { label: "Approvals", href: "/approvals", icon: ClipboardCheck, roles: ["admin", "client"] },
  { label: "Payments", href: "/payments", icon: DollarSign, roles: ["admin", "client"] },
  { label: "Activity", href: "/activity", icon: History, roles: ["admin"] },
  { label: "Clients", href: "/clients", icon: Users, roles: ["admin"] },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["admin", "client"] },
];

/** Items shown in the mobile bottom bar — keep to 5 for a clean tab bar. */
export const MOBILE_PRIMARY_HREFS = ["/dashboard", "/projects", "/tasks", "/calendar", "/availability"];
