import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/data/supabase/client";

// ============================================================================
// Every Supabase Auth email link (password reset, invite, sign-up
// confirmation) is configured to redirect here first with a `?code=...`
// (PKCE flow). This route exchanges that one-time code for a real session
// — setting the session cookies via the same cookie-bound client the rest
// of the app uses — then forwards on to wherever that flow actually needs
// the user to land next.
// ============================================================================

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
