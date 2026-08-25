"use server";

import { redirect } from "next/navigation";
import { getRepository } from "@/lib/data";
import { setSessionProfileId, clearSession } from "@/lib/data/mock/session";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * DEMO AUTH: the mock backend doesn't verify passwords — it looks up the
 * profile by email and starts a session. The Supabase adapter (see
 * src/lib/data/supabase/adapter.ts) wires this same action shape to real
 * Supabase Auth (signInWithPassword) once DATA_BACKEND=supabase is set.
 */
export async function loginAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { ok: false, error: "Enter your email address." };

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

export async function demoLoginAction(profileId: string) {
  await setSessionProfileId(profileId);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function signupAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!name || !email) return { ok: false, error: "Fill in your name and email." };
  // Demo mode: new admin sign-ups aren't persisted (no write-your-own-org flow
  // in the mock backend yet) — route them to sign in with a demo account so
  // the rest of the product is still reachable.
  return {
    ok: false,
    error:
      "Sign-up creates a real account once Supabase is connected. For now, use one of the demo accounts to explore the product.",
  };
}

export async function forgotPasswordAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { ok: false, error: "Enter your email address." };
  return { ok: true };
}
