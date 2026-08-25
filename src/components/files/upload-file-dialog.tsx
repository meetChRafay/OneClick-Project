"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createFileAction } from "@/lib/actions/files";
import type { FileCategory } from "@/types/domain";

const CATEGORIES: { value: FileCategory; label: string }[] = [
  { value: "videos", label: "Videos" },
  { value: "scripts", label: "Scripts" },
  { value: "voiceovers", label: "Voiceovers" },
  { value: "images", label: "Images" },
  { value: "thumbnails", label: "Thumbnails" },
  { value: "documents", label: "Documents" },
  { value: "references", label: "References" },
  { value: "other", label: "Other" },
];

export function UploadFileDialog({ projects }: { projects: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number | undefined>();
  const [fileMime, setFileMime] = useState<string | undefined>();
  const [category, setCategory] = useState<FileCategory>("documents");
  const [visibility, setVisibility] = useState<"internal" | "client_visible">("internal");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fileName) {
      toast.error("Choose a file first");
      return;
    }
    startTransition(async () => {
      try {
        await createFileAction({ projectId, name: fileName, category, visibility, sizeBytes: fileSize, mimeType: fileMime });
        toast.success("File uploaded");
        setOpen(false);
        setFileName("");
        router.refresh();
      } catch {
        toast.error("Couldn't upload that file");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Upload className="size-4" />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a file</DialogTitle>
          <DialogDescription>Files are stored in Supabase Storage once connected — this demo records file metadata only.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>File</Label>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground hover:bg-accent/50 transition-colors cursor-pointer"
            >
              {fileName || "Click to choose a file"}
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFileName(f.name);
                  setFileSize(f.size);
                  setFileMime(f.type);
                }
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as FileCategory)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Internal only</SelectItem>
                <SelectItem value="client_visible">Client visible</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={pending || !fileName || !projectId}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Upload
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
