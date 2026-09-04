import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

// The browser-only client lives in ./browser-client.ts, which has no
// server-only imports — keep it that way so Client Components can import
// it without accidentally pulling "next/headers" (used below) into the
// client bundle. Re-exported here so existing imports of this file still
// work.
export { createBrowserSupabaseClient } from "./browser-client";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Add it to .env.local (see .env.example) to use DATA_BACKEND=supabase.`
    );
  }
  return value;
}

/** Server-side Supabase client bound to the request's cookies (server components, actions, route handlers). */
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component render — safe to ignore when
          // middleware is refreshing the session.
        }
      },
    },
  });
}

/** Service-role client for privileged server-only operations (never import from client components). */
export function createServiceSupabaseClient(): SupabaseClient {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
