/**
 * Absolute base URL of this deployment, for building email-redirect links
 * (password reset, invite, signup confirmation) that Supabase Auth sends
 * out — those links have to be absolute since they're opened from an
 * inbox, not from within the app.
 *
 * Priority: an explicit NEXT_PUBLIC_SITE_URL (set this if you attach a
 * custom domain) → Vercel's automatic VERCEL_URL (set on every Vercel
 * deployment with no config needed) → localhost for local dev.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
