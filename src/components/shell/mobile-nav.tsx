"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions/auth";
import { BrandWordmark } from "@/components/brand-mark";
import { UserAvatar } from "@/components/user-avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS, MOBILE_PRIMARY_HREFS } from "./nav-items";
import type { UserRole } from "@/types/domain";

export function MobileNav({
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
  const [open, setOpen] = useState(false);
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role));
  const primary = items.filter((i) => MOBILE_PRIMARY_HREFS.includes(i.href));

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="grid grid-cols-6 h-14">
        {primary.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-4.5" />
              {item.label}
            </Link>
          );
        })}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground cursor-pointer">
              <Menu className="size-4.5" />
              More
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>
                <BrandWordmark />
              </SheetTitle>
            </SheetHeader>
            <div className="flex items-center gap-3 px-4 -mt-2">
              <UserAvatar name={userName} id={userId} />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{userName}</div>
                <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                      active ? "bg-accent text-accent-foreground" : "text-foreground/70 hover:bg-accent/60"
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t p-3 space-y-1">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/settings">
                  <Settings /> Settings
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => logoutAction()}>
                <LogOut /> Log out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
