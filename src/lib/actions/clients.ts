"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";

/**
 * Demo-mode invite: creates a Profile with role "client" (onboarding not yet
 * completed — this stands in for "invitation pending") plus the linked
 * Client record (no email is actually sent). The Supabase adapter wires
 * this to supabase.auth.admin.inviteUserByEmail + a DB trigger that creates
 * the matching profiles/clients rows on acceptance.
 */
export async function inviteClientAction(input: {
  clientName: string;
  email: string;
  companyName?: string;
  projectId?: string;
}) {
  const user = await requireAdmin();
  const repo = getRepository();

  const profile = await repo.createProfile({
    organization_id: user.organizationId,
    role: "client",
    full_name: input.clientName,
    email: input.email,
    avatar_url: null,
    title: null,
    timezone: "UTC",
    phone: null,
    onboarding_completed: false,
  });

  const client = await repo.createClient({
    organization_id: user.organizationId,
    profile_id: profile.id,
    company_name: input.companyName ?? input.clientName,
    notes_internal: null,
  });

  if (input.projectId) {
    await repo.addProjectMember({ project_id: input.projectId, profile_id: client.profile_id, role: "client" });
    await repo.logActivity({
      organization_id: user.organizationId,
      project_id: input.projectId,
      entity_type: "project",
      entity_id: input.projectId,
      actor_id: user.id,
      action: `invited ${input.clientName} as a client`,
    });
  }

  revalidatePath("/clients");
  revalidatePath("/projects");
  return client;
}

export async function updateClientNotesAction(clientId: string, notes: string) {
  const user = await requireAdmin();
  const repo = getRepository();
  const client = await repo.getClient(clientId);
  if (!client || client.organization_id !== user.organizationId) throw new Error("Client not found");
  await repo.updateClient(clientId, { notes_internal: notes || null });
  revalidatePath(`/clients/${clientId}`);
}
