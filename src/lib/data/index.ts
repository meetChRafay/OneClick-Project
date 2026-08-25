import type { Repository } from "./repository";
import { mockRepository } from "./mock/adapter";

// ============================================================================
// Single entry point every server component / server action / route handler
// uses to reach data. Swapping backends is one env var — no UI code changes.
//
//   DATA_BACKEND=mock      (default) — in-memory, seeded, zero setup.
//   DATA_BACKEND=supabase  — real Supabase project. Requires
//                            NEXT_PUBLIC_SUPABASE_URL and
//                            NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example
//                            and supabase/migrations for the schema).
// ============================================================================

let cached: Repository | null = null;

export function getRepository(): Repository {
  if (cached) return cached;

  const backend = process.env.DATA_BACKEND ?? "mock";

  if (backend === "supabase") {
    // Lazy import so the mock-only dev/demo path never pulls in the
    // Supabase SDK's Node runtime requirements.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { supabaseRepository } = require("./supabase/adapter") as typeof import("./supabase/adapter");
    cached = supabaseRepository;
    return supabaseRepository;
  }

  cached = mockRepository;
  return mockRepository;
}

export type { Repository, CurrentUser } from "./repository";
