import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Split out from client.ts on purpose: client.ts also exports
// createServerSupabaseClient, which imports "next/headers" — a
// server-only API. Bundling that into a Client Component (like
// hash-session-redirect.tsx) breaks the build ("You're importing a
// module that depends on 'next/headers'..."), even though the client
// component never calls the server function itself. Keeping the
// browser-only client in its own file with no server-only imports
// avoids pulling that code into the client bundle at all.

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Add it to .env.local (see .env.example) to use DATA_BACKEND=supabase.`
    );
  }
  return value;
}

/** Browser-side Supabase client (client components only). */
export function createBrowserSupabaseClient(): SupabaseClient {
  return createBrowserClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}
