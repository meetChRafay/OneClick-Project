"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  // In production this reads the invitation token from the URL and looks up
  // the pending invite (client name, project, role) via the Repository.
  const invite = {
    inviterName: "Abdul Rafay",
    projectName: "Health YouTube Channel",
    email: "you@example.com",
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback>AR</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <span className="font-medium">{invite.inviterName}</span>{" "}
            <span className="text-muted-foreground">invited you to</span>
          </div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{invite.projectName}</h1>
        <p className="text-sm text-muted-foreground">
          Create a password to finish setting up your client account.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setPending(true);
          setTimeout(() => router.push("/login"), 700);
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={invite.email} disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Your full name" required autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Create password</Label>
          <Input id="password" type="password" placeholder="Minimum 8 characters" required />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Accept invitation
        </Button>
      </form>
    </div>
  );
}
