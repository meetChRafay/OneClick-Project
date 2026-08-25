/**
 * Lightweight @mention detection for comment bodies (spec section 20).
 * Matches "@firstname" (case-insensitive) against known profiles. Good
 * enough for demo/production-seed purposes without a real mention-picker UI.
 */
export function detectMentionedProfileIds(
  body: string,
  profiles: { id: string; full_name: string }[],
  excludeId?: string
): string[] {
  const lower = body.toLowerCase();
  const ids: string[] = [];
  for (const p of profiles) {
    if (p.id === excludeId) continue;
    const first = p.full_name.split(" ")[0]?.toLowerCase();
    if (first && lower.includes(`@${first}`)) ids.push(p.id);
  }
  return ids;
}
