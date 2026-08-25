"use client";

import { useRouter } from "next/navigation";
import { FolderKanban, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ProjectStatusBadge } from "@/components/status-badge";
import type { Project } from "@/types/domain";

export function ProjectSwitcher({ projects }: { projects: Project[] }) {
  const router = useRouter();
  if (projects.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="hidden md:flex gap-1.5 max-w-52">
          <FolderKanban className="size-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">Jump to project</span>
          <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Your projects</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {projects.map((p) => (
          <DropdownMenuItem key={p.id} onClick={() => router.push(`/projects/${p.id}`)} className="flex items-center justify-between gap-2">
            <span className="truncate">{p.name}</span>
            <ProjectStatusBadge status={p.status} className="shrink-0" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
