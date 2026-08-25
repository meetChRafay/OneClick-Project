import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { getAccessibleProjectIds, visibleToRole } from "@/lib/authz";
import { PageHeader } from "@/components/page-header";
import { FileCard } from "@/components/file-card";
import { EmptyState } from "@/components/empty-state";
import { UploadFileDialog } from "@/components/files/upload-file-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { FileCategory } from "@/types/domain";

export const metadata: Metadata = { title: "Files" };

const CATEGORIES: { value: FileCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "videos", label: "Videos" },
  { value: "scripts", label: "Scripts" },
  { value: "voiceovers", label: "Voiceovers" },
  { value: "images", label: "Images" },
  { value: "thumbnails", label: "Thumbnails" },
  { value: "documents", label: "Documents" },
  { value: "references", label: "References" },
  { value: "other", label: "Other" },
];

export default async function FilesPage() {
  const user = await requireUser();
  const repo = getRepository();

  const scope = await getAccessibleProjectIds(repo, user);
  const [allFiles, projects, profiles, integrations] = await Promise.all([
    repo.listFiles(user.organizationId),
    repo.listProjects(user.organizationId, user.role === "client" ? { profileId: user.id } : undefined),
    repo.listProfiles(user.organizationId),
    repo.listIntegrations(user.organizationId),
  ]);

  const scoped = allFiles.filter((f) => !scope || scope.has(f.project_id));
  const files = visibleToRole(scoped, user.role);
  const profileMap = new Map(profiles.map((p) => [p.id, p.full_name]));
  const driveConnected = integrations.find((i) => i.provider === "google_drive")?.connected;

  return (
    <div>
      <PageHeader
        title="Files"
        subtitle={`${files.length} file${files.length === 1 ? "" : "s"}`}
        actions={
          user.role === "admin" ? (
            <UploadFileDialog projects={projects.map((p) => ({ id: p.id, name: p.name }))} />
          ) : undefined
        }
      />
      <div className="px-4 lg:px-6 pb-10 space-y-4">
        {user.role === "admin" && !driveConnected && (
          <div className="rounded-lg border border-status-info/30 bg-status-info-bg px-4 py-3 text-sm text-status-info flex items-center justify-between gap-3">
            <span>Connect Google Drive to sync files automatically instead of uploading manually.</span>
            <a href="/settings" className="font-medium hover:underline shrink-0">Connect in Settings</a>
          </div>
        )}
        <Tabs defaultValue="all">
          <TabsList className="mb-4 flex-wrap h-auto">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c.value} value={c.value}>{c.label}</TabsTrigger>
            ))}
          </TabsList>
          {CATEGORIES.map((c) => {
            const filtered = c.value === "all" ? files : files.filter((f) => f.category === c.value);
            return (
              <TabsContent key={c.value} value={c.value}>
                {filtered.length === 0 ? (
                  <EmptyState icon={FolderOpen} title="No files uploaded yet" description="Upload your first project file." />
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtered.map((f) => (
                      <FileCard key={f.id} file={f} uploaderName={profileMap.get(f.uploaded_by)} canDelete={user.role === "admin"} />
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
