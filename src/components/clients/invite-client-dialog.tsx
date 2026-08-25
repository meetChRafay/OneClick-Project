"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inviteClientAction } from "@/lib/actions/clients";

export function InviteClientDialog({ projects }: { projects: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [projectId, setProjectId] = useState<string>("none");

  function reset() {
    setName("");
    setEmail("");
    setCompany("");
    setProjectId("none");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await inviteClientAction({
          clientName: name,
          email,
          companyName: company || undefined,
          projectId: projectId === "none" ? undefined : projectId,
        });
        toast.success(`Invitation sent to ${name}`);
        setOpen(false);
        reset();
        router.refresh();
      } catch {
        toast.error("Couldn't send that invitation");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="size-4" />
          Invite Client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a client</DialogTitle>
          <DialogDescription>
            They&apos;ll get an email invite to create their account and see only what you give them access to.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Client name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane Cooper" required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" required />
          </div>
          <div className="space-y-1.5">
            <Label>Company</Label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" />
          </div>
          <div className="space-y-1.5">
            <Label>Give access to project (optional)</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project yet</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={pending || !name || !email}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Send invitation
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
