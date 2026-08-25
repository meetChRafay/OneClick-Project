"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "internal_review", label: "Internal Review" },
  { value: "client_review", label: "Client Review" },
  { value: "waiting_client", label: "Waiting for Client" },
  { value: "waiting_me", label: "Waiting for Me" },
  { value: "corrections_required", label: "Corrections Required" },
  { value: "blocked", label: "Blocked" },
  { value: "final_approval", label: "Final Approval" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function TaskFilters({
  projects,
  members,
}: {
  projects: { id: string; name: string }[];
  members: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function set(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = ["project", "status", "waiting", "assignee", "priority", "due", "q"].some((k) =>
    searchParams.get(k)
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-40 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Filter by title…"
          className="pl-8 h-8"
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => set("q", e.target.value || null)}
        />
      </div>

      <Select value={searchParams.get("due") ?? "any"} onValueChange={(v) => set("due", v === "any" ? null : v)}>
        <SelectTrigger size="sm" className="w-36"><SelectValue placeholder="Due" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any deadline</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
          <SelectItem value="today">Due today</SelectItem>
          <SelectItem value="week">Due this week</SelectItem>
        </SelectContent>
      </Select>

      <Select value={searchParams.get("waiting") ?? "any"} onValueChange={(v) => set("waiting", v === "any" ? null : v)}>
        <SelectTrigger size="sm" className="w-36"><SelectValue placeholder="Waiting for" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Waiting for anyone</SelectItem>
          <SelectItem value="me">Me</SelectItem>
          <SelectItem value="client">Client</SelectItem>
          <SelectItem value="both">Both</SelectItem>
          <SelectItem value="nobody">Nobody</SelectItem>
        </SelectContent>
      </Select>

      <Select value={searchParams.get("status") ?? "any"} onValueChange={(v) => set("status", v === "any" ? null : v)}>
        <SelectTrigger size="sm" className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any status</SelectItem>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get("project") ?? "any"} onValueChange={(v) => set("project", v === "any" ? null : v)}>
        <SelectTrigger size="sm" className="w-40"><SelectValue placeholder="Project" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="any">All projects</SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {members.length > 0 && (
        <Select value={searchParams.get("assignee") ?? "any"} onValueChange={(v) => set("assignee", v === "any" ? null : v)}>
          <SelectTrigger size="sm" className="w-40"><SelectValue placeholder="Assignee" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Anyone</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={searchParams.get("view") ?? "open"} onValueChange={(v) => set("view", v)}>
        <SelectTrigger size="sm" className="w-32"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="open">Open tasks</SelectItem>
          <SelectItem value="all">All tasks</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => router.push(pathname)}>
          <X className="size-3.5" /> Clear
        </Button>
      )}
    </div>
  );
}
