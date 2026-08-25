"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Lock, Eye, Send, Loader2 } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { relativeTime } from "@/lib/utils";
import type { Visibility } from "@/types/domain";

export interface CommentLike {
  id: string;
  author_id: string;
  body: string;
  visibility: Visibility;
  created_at: string;
}

export function CommentThread({
  comments,
  authorNames,
  currentUserId,
  currentUserRole,
  onSubmit,
  emptyLabel = "No comments yet. Start the conversation.",
}: {
  comments: CommentLike[];
  authorNames: Map<string, string>;
  currentUserId: string;
  currentUserRole: "admin" | "client";
  onSubmit: (body: string, visibility: Visibility) => Promise<unknown>;
  emptyLabel?: string;
}) {
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("client_visible");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!body.trim()) return;
    startTransition(async () => {
      try {
        await onSubmit(body, currentUserRole === "client" ? "client_visible" : visibility);
        setBody("");
        toast.success("Comment posted");
      } catch {
        toast.error("Couldn't post your comment");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <UserAvatar name={authorNames.get(c.author_id) ?? "?"} id={c.author_id} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{authorNames.get(c.author_id) ?? "Unknown"}</span>
                  <span className="text-xs text-muted-foreground">{relativeTime(c.created_at)}</span>
                  {c.visibility === "internal" && (
                    <Badge variant="outline" className="text-[10px]">
                      <Lock className="size-2.5" /> Internal
                    </Badge>
                  )}
                </div>
                <p className="text-sm mt-0.5 whitespace-pre-wrap">{c.body}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-3">
        <UserAvatar name={authorNames.get(currentUserId) ?? "Me"} id={currentUserId} size="sm" />
        <div className="min-w-0 flex-1 space-y-2">
          <Textarea
            placeholder="Write a comment…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
          />
          <div className="flex items-center justify-between">
            {currentUserRole === "admin" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1">
                    {visibility === "internal" ? <Lock className="size-3" /> : <Eye className="size-3" />}
                    {visibility === "internal" ? "Internal only" : "Client visible"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setVisibility("client_visible")}>
                    <Eye /> Client visible
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibility("internal")}>
                    <Lock /> Internal only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span />
            )}
            <Button size="sm" onClick={submit} disabled={pending || !body.trim()}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Comment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
