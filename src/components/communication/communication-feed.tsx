"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MessagesSquare,
  CheckSquare,
  AlertTriangle,
  Stamp,
  Lock,
  AtSign,
  Search,
} from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { relativeTime } from "@/lib/utils";
import type { Visibility } from "@/types/domain";

export interface CommunicationItem {
  id: string;
  source: "task" | "issue" | "approval";
  sourceTitle: string;
  projectId: string;
  projectName: string;
  authorId: string;
  authorName: string;
  authorRole: "admin" | "client";
  body: string;
  visibility: Visibility;
  createdAt: string;
  mentionedIds: string[];
  unread: boolean;
  href: string;
}

const SOURCE_META = {
  task: { label: "Task", icon: CheckSquare, verb: "commented on" },
  issue: { label: "Issue", icon: AlertTriangle, verb: "commented on" },
  approval: { label: "Approval", icon: Stamp, verb: "left feedback on" },
};

type FilterTab = "all" | "unread" | "mentions" | "task" | "issue" | "client";

const TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "mentions", label: "Mentions" },
  { value: "task", label: "Task" },
  { value: "issue", label: "Issues" },
  { value: "client", label: "Client" },
];

export function CommunicationFeed({
  items,
  currentUserId,
  projects,
}: {
  items: CommunicationItem[];
  currentUserId: string;
  projects: { id: string; name: string }[];
}) {
  const [tab, setTab] = useState<FilterTab>("all");
  const [projectId, setProjectId] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = items;
    if (projectId !== "all") list = list.filter((i) => i.projectId === projectId);
    switch (tab) {
      case "unread":
        list = list.filter((i) => i.unread);
        break;
      case "mentions":
        list = list.filter((i) => i.mentionedIds.includes(currentUserId));
        break;
      case "task":
        list = list.filter((i) => i.source === "task");
        break;
      case "issue":
        list = list.filter((i) => i.source === "issue");
        break;
      case "client":
        list = list.filter((i) => i.authorRole === "client");
        break;
      default:
        break;
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.body.toLowerCase().includes(q) ||
          i.authorName.toLowerCase().includes(q) ||
          i.sourceTitle.toLowerCase().includes(q) ||
          i.projectName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, tab, projectId, query, currentUserId]);

  const counts = useMemo(() => {
    const base = projectId === "all" ? items : items.filter((i) => i.projectId === projectId);
    return {
      all: base.length,
      unread: base.filter((i) => i.unread).length,
      mentions: base.filter((i) => i.mentionedIds.includes(currentUserId)).length,
      task: base.filter((i) => i.source === "task").length,
      issue: base.filter((i) => i.source === "issue").length,
      client: base.filter((i) => i.authorRole === "client").length,
    };
  }, [items, projectId, currentUserId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)} className="min-w-0">
          <TabsList className="flex-wrap h-auto">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label} ({counts[t.value]})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2 sm:ml-auto">
          {projects.length > 1 && (
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="w-44 shrink-0"><SelectValue placeholder="All projects" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages…"
              className="pl-8"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="Nothing here"
          description="No messages match these filters yet."
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => {
            const meta = SOURCE_META[item.source];
            const Icon = meta.icon;
            const mentioned = item.mentionedIds.includes(currentUserId);
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex gap-3 rounded-xl border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <UserAvatar name={item.authorName} id={item.authorId} size="sm" className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-sm">
                    <span className="font-medium">{item.authorName}</span>
                    <span className="text-muted-foreground">{meta.verb}</span>
                    <span className="font-medium truncate max-w-[16rem]">{item.sourceTitle}</span>
                    {item.unread && <span className="size-1.5 rounded-full bg-primary shrink-0" aria-label="Unread" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.body}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <Badge variant="outline" className="text-[10px]">
                      <Icon className="size-2.5" /> {meta.label}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">{item.projectName}</Badge>
                    {item.visibility === "internal" && (
                      <Badge variant="outline" className="text-[10px]">
                        <Lock className="size-2.5" /> Internal
                      </Badge>
                    )}
                    {mentioned && (
                      <Badge variant="info" className="text-[10px]">
                        <AtSign className="size-2.5" /> Mentions you
                      </Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground ml-auto shrink-0">{relativeTime(item.createdAt)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
