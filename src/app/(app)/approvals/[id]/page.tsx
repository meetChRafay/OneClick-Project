import { notFound } from "next/navigation";
import Link from "next/link";
import { FolderKanban, CheckSquare, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { getAccessibleProjectIds } from "@/lib/authz";
import { ApprovalCard } from "@/components/approval-card";
import { FileCard } from "@/components/file-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const repo = getRepository();

  const approval = await repo.getApproval(id);
  if (!approval || approval.organization_id !== user.organizationId) notFound();

  const scope = await getAccessibleProjectIds(repo, user);
  if (scope && !scope.has(approval.project_id)) notFound();

  const [project, task, topic, file] = await Promise.all([
    repo.getProject(approval.project_id),
    approval.task_id ? repo.getTask(approval.task_id) : Promise.resolve(null),
    approval.topic_id ? repo.getTopic(approval.topic_id) : Promise.resolve(null),
    approval.file_id ? repo.listFiles(user.organizationId, { projectId: approval.project_id }) : Promise.resolve([]),
  ]);

  const linkedFile = file.find((f) => f.id === approval.file_id);

  return (
    <div className="px-4 lg:px-6 py-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/projects" className="hover:underline flex items-center gap-1">
          <FolderKanban className="size-3.5" />
          {project?.name}
        </Link>
        <span>/</span>
        <Link href="/approvals" className="hover:underline">Approvals</Link>
      </div>

      <ApprovalCard approval={approval} canDecide={user.role === "client" && approval.status === "waiting_client"} linkToDetail={false} />

      {linkedFile && (
        <Card className="p-0">
          <CardHeader className="pt-5 pb-0"><CardTitle className="text-sm">File under review</CardTitle></CardHeader>
          <CardContent className="pt-4 pb-5">
            <FileCard file={linkedFile} />
          </CardContent>
        </Card>
      )}

      {(task || topic) && (
        <Card className="p-0">
          <CardHeader className="pt-5 pb-0"><CardTitle className="text-sm">Context</CardTitle></CardHeader>
          <CardContent className="pt-4 pb-5 space-y-2">
            {task && (
              <Link href={`/tasks/${task.id}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                <CheckSquare className="size-3.5" /> {task.title}
              </Link>
            )}
            {topic && (
              <Link href="/topics" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                <Sparkles className="size-3.5" /> {topic.title}
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
