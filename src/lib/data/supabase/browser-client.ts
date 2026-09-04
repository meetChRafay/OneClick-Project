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
//
// IMPORTANT: Next.js only inlines a NEXT_PUBLIC_* env var into the
// browser bundle when it's referenced as a literal, static expression —
// exactly `process.env.NEXT_PUBLIC_SUPABASE_URL`, spelled out. Its build
// step scans the source text for that exact pattern and substitutes the
// real value at build time. A dynamic lookup like `process.env[name]`
// (name being a variable) can't be statically analyzed, so nothing gets
// inlined there — in the shipped browser code that expression just
// evaluates to undefined at runtime, since no real `process.env` object
// is sent to the browser. That's what was happening here: this file's
// old requireEnv(name) helper used `process.env[name]`, so both
// NEXT_PUBLIC_ vars always came back undefined in the browser and threw,
// even though they were correctly set in Vercel. Reading them as literal
// `process.env.NEXT_PUBLIC_...` below (no helper, no bracket access) is
// what makes Next.js actually inline the real values.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Browser-side Supabase client (client components only). */
export function createBrowserSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Add it to .env.local (see .env.example) to use DATA_BACKEND=supabase."
    );
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
