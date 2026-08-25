"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { requireAdmin, requireUser } from "@/lib/auth";
import type { IntegrationProvider, NotificationPrefs } from "@/types/domain";

export async function updateProfileSettingsAction(patch: {
  fullName?: string;
  phone?: string | null;
  title?: string | null;
  timezone?: string;
}) {
  const user = await requireUser();
  const repo = getRepository();
  await repo.updateProfile(user.id, {
    ...(patch.fullName ? { full_name: patch.fullName } : {}),
    ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.timezone ? { timezone: patch.timezone } : {}),
  });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function updateNotificationPrefsAction(prefs: NotificationPrefs) {
  const user = await requireUser();
  const repo = getRepository();
  await repo.updateProfile(user.id, { notification_prefs: prefs });
  revalidatePath("/settings");
}

export async function completeOnboardingAction() {
  const user = await requireUser();
  const repo = getRepository();
  await repo.updateProfile(user.id, { onboarding_completed: true });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

/**
 * Demo-mode "connect": simulates a completed OAuth handshake by recording the
 * account email directly. The Supabase adapter wires this to the real OAuth
 * redirect flow (Google) once DATA_BACKEND=supabase is set — see the
 * Integration type's `scopes`/`metadata` fields for what that flow persists.
 */
export async function connectIntegrationAction(provider: IntegrationProvider, accountEmail: string, perUser: boolean) {
  const user = await requireAdmin();
  const repo = getRepository();
  await repo.upsertIntegration({
    id: "",
    organization_id: user.organizationId,
    profile_id: perUser ? user.id : null,
    provider,
    connected: true,
    account_email: accountEmail,
    scopes: null,
    metadata: null,
    connected_at: new Date().toISOString(),
  });
  revalidatePath("/settings");
  revalidatePath("/files");
  revalidatePath("/calendar");
}

export async function disconnectIntegrationAction(provider: IntegrationProvider, perUser: boolean) {
  const user = await requireAdmin();
  const repo = getRepository();
  await repo.upsertIntegration({
    id: "",
    organization_id: user.organizationId,
    profile_id: perUser ? user.id : null,
    provider,
    connected: false,
    account_email: null,
    scopes: null,
    metadata: null,
    connected_at: null,
  });
  revalidatePath("/settings");
  revalidatePath("/files");
  revalidatePath("/calendar");
}

export async function updateOrganizationAction(name: string) {
  const user = await requireAdmin();
  const repo = getRepository();
  await repo.updateOrganization(user.organizationId, { name });
  revalidatePath("/settings");
}
