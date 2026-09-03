"use server";

import { redirect } from "next/navigation";
import { getRepository } from "@/lib/data";
import { setSessionProfileId, clearSession } from "@/lib/data/mock/session";
import { createServerSupabaseClient } from "@/lib/data/supabase/client";
import { getSiteUrl } from "@/lib/site-url";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const isSupabase = () => process.env.DATA_BACKEND === "supabase";

function readableAuthError(message: string): string {
  // Supabase's own messages are already reasonably user-facing; a couple of
  // common ones read better rephrased for this app's context.
  if (/invalid login credentials/i.test(message)) return "Incorrect email or password.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email address first — check your inbox.";
  return message;
}

/**
 * Sign in. Mock backend: demo mode — looks up the profile by email and
 * starts a session without checking the password (see the demo accounts on
 * the login page). Supabase backend: a real password check via
 * supabase.auth.signInWithPassword.
 */
export async function loginAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email) return { ok: false, error: "Enter your email address." };

  if (isSupabase()) {
    if (!password) return { ok: false, error: "Enter your password." };
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: readableAuthError(error.message) };
    redirect("/dashboard");
  }

  const repo = getRepository();
  const org = await repo.getOrganization("org_1");
  const profiles = org ? await repo.listProfiles(org.id) : [];
  const profile = profiles.find((p) => p.email.toLowerCase() === email);

  if (!profile) {
    return {
      ok: false,
      error: "No account found for that email. Try the demo accounts below.",
    };
  }

  await setSessionProfileId(profile.id);
  redirect("/dashboard");
}

/** Demo-mode only — not called at all when DATA_BACKEND=supabase (the login page hides these buttons). */
export async function demoLoginAction(profileId: string) {
  await setSessionProfileId(profileId);
  redirect("/dashboard");
}

export async function logoutAction() {
  if (isSupabase()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    redirect("/login");
  }
  await clearSession();
  redirect("/login");
}

/**
 * Create a brand-new agency workspace. Supabase backend: creates a real
 * auth user; a database trigger (supabase/migrations/0004_auth_provisioning.sql)
 * creates the matching organization + admin profile the instant the auth
 * user row exists. Mock backend: no write-your-own-org flow, so this just
 * points people at the demo accounts.
 */
export async function signupAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!name || !email) return { ok: false, error: "Fill in your name and email." };

  if (isSupabase()) {
    if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, signup_type: "new_workspace", organization_name: `${name}'s Workspace` },
        emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/dashboard`,
      },
    });
    if (error) return { ok: false, error: readableAuthError(error.message) };
    if (data.session) redirect("/dashboard"); // email confirmation is off for this project
    redirect("/verify-email");
  }

  return {
    ok: false,
    error:
      "Sign-up creates a real account once Supabase is connected. For now, use one of the demo accounts to explore the product.",
  };
}

/** "Forgot password" — sends a real reset email on the Supabase backend, a no-op success on mock. */
export async function forgotPasswordAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { ok: false, error: "Enter your email address." };

  if (isSupabase()) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
    });
    // Deliberately don't reveal whether the email exists — same success
    // message either way, which is the standard practice for this flow.
    if (error) return { ok: false, error: readableAuthError(error.message) };
  }
  return { ok: true };
}

/** Sets a new password for whoever the current session belongs to — used by both the reset-password and accept-invitation pages. */
export async function updatePasswordAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const fullName = formData.get("name") ? String(formData.get("name")).trim() : undefined;
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  if (!isSupabase()) return { ok: true }; // mock backend: nothing to actually update

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({
    password,
    ...(fullName ? { data: { full_name: fullName } } : {}),
  });
  if (error) return { ok: false, error: readableAuthError(error.message) };
  return { ok: true };
}

/**
 * Finishes a client invitation: the invite link's /auth/callback exchange
 * already signed this browser in under a temporary recovery session (the
 * profiles/clients rows were provisioned by the database trigger the
 * moment the invite was sent — see 0004_auth_provisioning.sql). This just
 * sets the real password, confirms/corrects their display name, and marks
 * onboarding complete.
 */
export async function acceptInvitationAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("name") ?? "").trim();
  if (!fullName) return { ok: false, error: "Enter your full name." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  if (!isSupabase()) return { ok: true };

  const supabase = await createServerSupabaseClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return { ok: false, error: "This invitation link has expired. Ask for a new one." };

  const { error } = await supabase.auth.updateUser({ password, data: { full_name: fullName } });
  if (error) return { ok: false, error: readableAuthError(error.message) };

  const repo = getRepository();
  await repo.updateProfile(userData.user.id, { full_name: fullName, onboarding_completed: true });
  return { ok: true };
}
