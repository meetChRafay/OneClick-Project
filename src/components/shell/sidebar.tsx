"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandWordmark } from "@/components/brand-mark";
import { NAV_ITEMS } from "./nav-items";
import type { UserRole } from "@/types/domain";
import { UserMenu } from "./user-menu";

export function Sidebar({
  role,
  userName,
  userEmail,
  userId,
}: {
  role: UserRole;
  userName: string;
  userEmail: string;
  userId: string;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role));

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground h-screen sticky top-0">
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <BrandWordmark />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <UserMenu userName={userName} userEmail={userEmail} userId={userId} role={role} />
      </div>
    </aside>
  );
}
