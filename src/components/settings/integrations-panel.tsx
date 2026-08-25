"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HardDrive, CalendarDays, Mail, MessageCircle, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { GoogleIcon } from "@/components/icons/google-icon";
import { connectIntegrationAction, disconnectIntegrationAction } from "@/lib/actions/settings";
import type { Integration, IntegrationProvider } from "@/types/domain";

const GOOGLE_PROVIDERS: {
  provider: IntegrationProvider;
  label: string;
  description: string;
  icon: typeof HardDrive;
  perUser: boolean;
}[] = [
  {
    provider: "google_drive",
    label: "Google Drive",
    description: "Auto-create project folders and sync files instead of uploading manually.",
    icon: HardDrive,
    perUser: false,
  },
  {
    provider: "google_calendar",
    label: "Google Calendar",
    description: "Two-way sync meetings and deadlines. Others only ever see your free/busy status.",
    icon: CalendarDays,
    perUser: true,
  },
  {
    provider: "gmail",
    label: "Gmail",
    description: "Send client-facing notifications from your own inbox instead of a no-reply address.",
    icon: Mail,
    perUser: true,
  },
];

const COMING_SOON: { label: string; description: string; icon: typeof HardDrive }[] = [
  { label: "Slack", description: "Mirror project activity into a Slack channel.", icon: MessageCircle },
  { label: "WhatsApp", description: "Send task and approval updates over WhatsApp.", icon: MessageCircle },
  { label: "Telegram", description: "Notify your team via a Telegram bot.", icon: Send },
];

export function IntegrationsPanel({ integrations, currentUserId }: { integrations: Integration[]; currentUserId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pendingProvider, setPendingProvider] = useState<IntegrationProvider | null>(null);

  function findConnection(provider: IntegrationProvider, perUser: boolean) {
    return integrations.find(
      (i) => i.provider === provider && (perUser ? i.profile_id === currentUserId : !i.profile_id)
    );
  }

  function disconnect(provider: IntegrationProvider, perUser: boolean) {
    setPendingProvider(provider);
    startTransition(async () => {
      try {
        await disconnectIntegrationAction(provider, perUser);
        toast.success("Disconnected");
        router.refresh();
      } catch {
        toast.error("Couldn't disconnect");
      } finally {
        setPendingProvider(null);
      }
    });
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="space-y-3">
        {GOOGLE_PROVIDERS.map(({ provider, label, description, icon: Icon, perUser }) => {
          const connection = findConnection(provider, perUser);
          const busy = pending && pendingProvider === provider;
          return (
            <div key={provider} className="flex items-start gap-3 rounded-xl border p-3.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted shrink-0">
                <Icon className="size-4.5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{label}</span>
                  {connection?.connected ? (
                    <Badge variant="success" className="text-[10px]">
                      <CheckCircle2 className="size-2.5" /> Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">Not connected</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                {connection?.connected && connection.account_email && (
                  <p className="text-xs text-muted-foreground mt-1">as {connection.account_email}</p>
                )}
              </div>
              {connection?.connected ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={busy}
                  onClick={() => disconnect(provider, perUser)}
                >
                  {busy && <Loader2 className="size-3.5 animate-spin" />}
                  Disconnect
                </Button>
              ) : (
                <ConnectDialog provider={provider} label={label} perUser={perUser} />
              )}
            </div>
          );
        })}
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2.5">Coming soon</p>
        <div className="space-y-2">
          {COMING_SOON.map(({ label, description, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-dashed p-3.5 opacity-70">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted shrink-0">
                <Icon className="size-4.5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium">{label}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
              <Button variant="outline" size="sm" disabled className="shrink-0">Coming soon</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConnectDialog({ provider, label, perUser }: { provider: IntegrationProvider; label: string; perUser: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await connectIntegrationAction(provider, email, perUser);
        toast.success(`${label} connected`);
        setOpen(false);
        setEmail("");
        router.refresh();
      } catch {
        toast.error("Couldn't connect");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="shrink-0">Connect</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GoogleIcon className="size-4" /> Connect {label}
          </DialogTitle>
          <DialogDescription>
            This demo simulates the OAuth handshake — enter the Google account you&apos;d sign in with. Once
            Supabase is connected, this becomes a real Google consent screen.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Google account</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" required autoFocus />
          </div>
          <Button type="submit" className="w-full" disabled={pending || !email}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Continue with Google
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
