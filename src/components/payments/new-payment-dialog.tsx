"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPaymentAction } from "@/lib/actions/payments";

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

function randomInvoiceNumber() {
  const year = new Date().getFullYear();
  const n = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}-${n}`;
}

export function NewPaymentDialog({
  projects,
}: {
  projects: { id: string; name: string; clientId: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [invoiceNumber, setInvoiceNumber] = useState(randomInvoiceNumber());
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [sendNow, setSendNow] = useState(true);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    startTransition(async () => {
      try {
        await createPaymentAction({
          projectId,
          clientId: project.clientId,
          invoiceNumber,
          description,
          amount: Number(amount),
          dueDate,
          status: sendNow ? "sent" : "draft",
        });
        toast.success(sendNow ? "Invoice created and sent to the client" : "Invoice saved as draft");
        setOpen(false);
        setDescription("");
        setAmount("");
        setInvoiceNumber(randomInvoiceNumber());
        setDueDate(defaultDueDate());
        router.refresh();
      } catch {
        toast.error("Couldn't create that invoice");
      }
    });
  }

  if (projects.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New Invoice
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New invoice</DialogTitle>
          <DialogDescription>Record what a project owes and track it through to payment.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Invoice number</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Amount (USD)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this invoice for?"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Due date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={sendNow}
              onChange={(e) => setSendNow(e.target.checked)}
              className="size-3.5"
            />
            Send to the client now (otherwise saved as a draft)
          </label>
          <Button type="submit" className="w-full" disabled={pending || !description || !amount || !projectId}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {sendNow ? "Create and send" : "Save draft"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
