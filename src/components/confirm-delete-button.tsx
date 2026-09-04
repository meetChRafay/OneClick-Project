"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

/**
 * A "Delete <thing>" button that always confirms first. Used on the
 * Project / Task / Client / Issue detail pages (admin-only). `action`
 * should be a bound server action call, e.g. () => deleteProjectAction(id).
 * If `redirectTo` is given, the user is sent there after a successful
 * delete (since the page they're on stops existing).
 */
export function ConfirmDeleteButton({
  label,
  itemName,
  warning,
  action,
  redirectTo,
}: {
  /** e.g. "project", "task", "client", "issue" */
  label: string;
  itemName: string;
  /** extra sentence about what else gets deleted along with it, if anything */
  warning?: string;
  action: () => Promise<unknown>;
  redirectTo?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="size-4" /> Delete {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this {label}?</DialogTitle>
          <DialogDescription>
            {`This will permanently delete "${itemName}". `}
            {warning ?? "This cannot be undone."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={pending}>Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await action();
                  toast.success(`${label.charAt(0).toUpperCase()}${label.slice(1)} deleted`);
                  setOpen(false);
                  if (redirectTo) router.push(redirectTo);
                  router.refresh();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : `Failed to delete this ${label}`);
                }
              })
            }
          >
            {pending ? "Deleting…" : `Delete ${label}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
