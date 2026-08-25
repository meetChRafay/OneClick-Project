import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAiConfigured, runAiSuggestion, type AiSuggestionKind } from "@/lib/integrations/ai";

/**
 * Stub API route for AI-assisted suggestions (spec section 53). Architecture
 * only — see src/lib/integrations/ai.ts for why this intentionally returns
 * 501 in every environment that doesn't set ANTHROPIC_API_KEY, which is all
 * of them by default in this build.
 */
export async function POST(request: Request) {
  await requireUser();

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "AI features aren't configured in this environment yet." },
      { status: 501 }
    );
  }

  const body = (await request.json().catch(() => null)) as { kind?: AiSuggestionKind; context?: string } | null;
  if (!body?.kind || !body.context) {
    return NextResponse.json({ error: "Missing 'kind' or 'context'." }, { status: 400 });
  }

  try {
    const result = await runAiSuggestion({ kind: body.kind, context: body.context });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI suggestion failed." }, { status: 501 });
  }
}
