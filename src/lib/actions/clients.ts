"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";
import { createServiceSupabaseClient } from "@/lib/data/supabase/client";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Invite a client. Supabase backend: sends a real invite email via
 * supabase.auth.admin.inviteUserByEmail (this needs the service-role key —
 * an ordinary user can never be allowed to create other Auth users, so this
 * one call is the one place in the app that uses the privileged client).
 * The profiles + clients rows get created the instant that auth user exists
 * by the database trigger in 0004_auth_provisioning.sql, reading the
 * `data` metadata passed below — nothing else in this action writes those
 * rows on that backend.
 *
 * Mock backend: no real email system, so this creates the Profile/Client
 * records directly and calls it "invited" (matches every other demo-mode
 * shortcut in this build).
 */
export async function inviteClientAction(input: {
  clientName: string;
  email: string;
  companyName?: string;
  projectId?: string;
}) {
  const user = await requireAdmin();
  const repo = getRepository();

  if (process.env.DATA_BACKEND === "supabase") {
    const supabase = createServiceSupabaseClient();
    const { error } = await supabase.auth.admin.inviteUserByEmail(input.email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/accept-invitation`,
      data: {
        signup_type: "client_invite",
        full_name: input.clientName,
        organization_id: user.organizationId,
        company_name: input.companyName ?? input.clientName,
        ...(input.projectId ? { project_id: input.projectId } : {}),
      },
    });
    if (error) throw new Error(error.message);

    if (input.projectId) {
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
    return null;
  }

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

export async function deleteClientAction(clientId: string) {
  const user = await requireAdmin();
  const repo = getRepository();
  const client = await repo.getClient(clientId);
  if (!client || client.organization_id !== user.organizationId) throw new Error("Client not found");
  // Removing a client also removes every project that belongs to them
  // (and everything under those projects) — see 0005_delete_policies.sql.
  await repo.deleteClient(clientId);
  revalidatePath("/clients");
  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/issues");
  revalidatePath("/dashboard");
}
