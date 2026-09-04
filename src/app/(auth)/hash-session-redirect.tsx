"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/data/supabase/client";

/**
 * Supabase's admin-issued email links (client invites sent via
 * supabase.auth.admin.inviteUserByEmail, and some password-recovery links)
 * come back with the session tokens in the URL *hash* fragment —
 * `#access_token=...&refresh_token=...&type=invite` — rather than the
 * `?code=` query param that /auth/callback/route.ts handles. A hash
 * fragment never reaches the server, so nothing server-side can see it or
 * act on it; the browser just lands on whatever page the Site URL points
 * at (here, that bounces unauthenticated visitors to /login) with the
 * tokens sitting unused in the address bar.
 *
 * This runs client-side on every (auth) page, notices those tokens,
 * turns them into a real signed-in session via setSession, and then sends
 * the browser on to wherever that flow actually needs to land.
 */
export function HashSessionRedirect() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (!accessToken || !refreshToken) {
      // Nothing usable in the hash (e.g. an #error=... from an expired
      // link) — just strip it so it doesn't linger in the address bar.
      if (params.get("error")) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      return;
    }

    let cancelled = false;
    const supabase = createBrowserSupabaseClient();
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
      if (cancelled) return;
      const destination =
        type === "recovery" ? "/reset-password" : type === "invite" ? "/accept-invitation" : "/dashboard";
      window.location.replace(error ? "/login?error=session_setup_failed" : destination);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
