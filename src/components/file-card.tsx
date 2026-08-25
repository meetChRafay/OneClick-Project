"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  FileText,
  FileVideo,
  FileAudio,
  FileImage,
  FileArchive,
  MoreHorizontal,
  Download,
  Trash2,
  Lock,
  Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { deleteFileAction } from "@/lib/actions/files";
import { formatDate } from "@/lib/utils";
import type { FileCategory, ProjectFile } from "@/types/domain";

const CATEGORY_ICON: Record<FileCategory, typeof FileText> = {
  videos: FileVideo,
  scripts: FileText,
  voiceovers: FileAudio,
  images: FileImage,
  thumbnails: FileImage,
  documents: FileText,
  references: FileArchive,
  other: FileText,
};

function formatSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileCard({
  file,
  uploaderName,
  canDelete,
}: {
  file: ProjectFile;
  uploaderName?: string;
  canDelete?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const Icon = CATEGORY_ICON[file.category];

  return (
    <Card className="p-0 hover:shadow-md transition-shadow">
      <div className="p-4 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4.5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">{file.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {formatSize(file.size_bytes)} {file.size_bytes ? "·" : ""} v{file.version} · {formatDate(file.created_at)}
            {uploaderName && ` · ${uploaderName}`}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <Badge variant="neutral" className="capitalize">{file.category}</Badge>
            {file.visibility === "internal" ? (
              <Badge variant="outline"><Lock className="size-3" />Internal</Badge>
            ) : (
              <Badge variant="info"><Eye className="size-3" />Client Visible</Badge>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toast.info("Preview coming soon in this demo")}>
              <Eye /> Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Downloads are disabled in this demo environment")}>
              <Download /> Download
            </DropdownMenuItem>
            {canDelete && (
              <DropdownMenuItem
                variant="destructive"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteFileAction(file.id, file.project_id);
                    toast.success("File deleted");
                  })
                }
              >
                <Trash2 /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
