import type { Repository } from "@/lib/data/repository";

// ============================================================================
// Supabase-backed Repository implementation.
//
// This file is completed in supabase/migrations (schema) + this adapter as
// part of connecting a real Supabase project — see README.md "Connecting
// Supabase" for the exact steps. Until then, selecting DATA_BACKEND=supabase
// fails loudly and clearly instead of silently falling back to demo data,
// so a misconfigured deployment can never be mistaken for a working one.
//
// The full method-by-method implementation (mirroring
// src/lib/data/mock/adapter.ts one-for-one against the schema in
// supabase/migrations/0001_init.sql) is intentionally not stubbed out with
// forty empty functions here — build it against your actual project once
// the schema is applied, using the Repository interface in
// src/lib/data/repository.ts as the contract and the mock adapter as the
// reference implementation for business rules (approval → task cascades,
// project health scoring, etc).
// ============================================================================

function notConfigured(): never {
  throw new Error(
    "DATA_BACKEND=supabase is set, but the Supabase repository adapter has not been implemented for this project yet. " +
      "Apply supabase/migrations, set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY, " +
      "then implement src/lib/data/supabase/adapter.ts against src/lib/data/repository.ts " +
      "(use src/lib/data/mock/adapter.ts as the reference implementation). " +
      "Until then, unset DATA_BACKEND (or set it to \"mock\") to use the fully-functional demo backend."
  );
}

export const supabaseRepository: Repository = new Proxy(
  {},
  {
    get() {
      return notConfigured;
    },
  }
) as Repository;
