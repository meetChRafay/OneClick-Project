import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AcceptInvitationForm } from "./accept-invitation-form";

export default async function AcceptInvitationPage() {
  // Landing here means /auth/callback already exchanged the invite link's
  // one-time code for a session (or, on the mock backend, there's no real
  // invite flow — the form below still renders so the screen is reachable
  // for a look, it just no-ops on submit).
  const user = await getCurrentUser();

  const email = user?.email ?? "you@example.com";
  const inviterName = "Abdul Rafay"; // the agency's name shown on every invite in this build

  if (process.env.DATA_BACKEND === "supabase" && !user) {
    redirect("/login?error=invitation_expired");
  }

  return (
    <AcceptInvitationForm email={email} inviterName={inviterName} defaultName={user?.fullName ?? ""} />
  );
}
