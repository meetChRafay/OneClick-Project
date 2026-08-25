"use client";

import Link from "next/link";
import { ChevronsUpDown, LogOut, Settings, UserCircle } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { UserAvatar } from "@/components/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserRole } from "@/types/domain";

export function UserMenu({
  userName,
  userEmail,
  userId,
  role,
}: {
  userName: string;
  userEmail: string;
  userId: string;
  role: UserRole;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-sidebar-accent/60 transition-colors cursor-pointer">
          <UserAvatar name={userName} id={userId} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{userName}</div>
            <div className="text-xs text-sidebar-foreground/60 capitalize truncate">{role}</div>
          </div>
          <ChevronsUpDown className="size-3.5 text-sidebar-foreground/40 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-medium text-foreground">{userName}</div>
          <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <UserCircle />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => logoutAction()}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
