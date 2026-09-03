import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ============================================================================
// Refreshes the Supabase Auth session cookie on every request. This is the
// standard @supabase/ssr pattern: an access token expires (default: 1 hour),
// and without this middleware a page could render mid-request with a
// session that's just gone stale, log the user out unexpectedly, or (worse)
// serve a Server Component from a cache path that never got a chance to
// refresh cookies at all.
//
// A no-op (returns immediately) when DATA_BACKEND isn't "supabase" — the
// mock backend has no Supabase session to refresh.
// ============================================================================

export async function proxy(request: NextRequest) {
  if (process.env.DATA_BACKEND !== "supabase") {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Touching getUser() is what actually triggers a refresh if the access
  // token is expired (getSession() alone would not).
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Skip static assets and image optimization; run on everything else
    // (including API routes, since they use the same cookie-bound client).
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
