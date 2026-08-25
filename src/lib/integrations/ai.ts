/**
 * AI features (spec section 53) — architecture only. Per the spec, AI is
 * explicitly NOT implemented in this build (no API calls are made, no
 * usage-based cost is incurred by running this app). What's here is the
 * shape a real implementation would fill in: a typed request/response
 * contract, the API route that would front it, and the UI hook points
 * where a "Suggest with AI" affordance would live.
 *
 * Intended call sites once enabled (none of these call this module today):
 *  - Topic → task breakdown: "Suggest tasks" button on a new Topic.
 *  - Comment thread digest: "Summarize" on a long CommentThread.
 *  - Client status update draft: "Draft an update" on a Project's Overview tab.
 *
 * To enable: set ANTHROPIC_API_KEY (or another provider's key) and replace
 * the body of `runAiSuggestion` with a real call — every call site already
 * routes through this one function, so nothing else needs to change.
 */

export type AiSuggestionKind = "task_breakdown" | "thread_summary" | "status_update_draft";

export interface AiSuggestionRequest {
  kind: AiSuggestionKind;
  /** Free-form context: a topic title, a comment thread's text, a project's recent activity, etc. */
  context: string;
}

export interface AiSuggestionResult {
  kind: AiSuggestionKind;
  output: string;
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function runAiSuggestion(request: AiSuggestionRequest): Promise<AiSuggestionResult> {
  if (!isAiConfigured()) {
    throw new Error("AI features aren't configured. Set ANTHROPIC_API_KEY to enable AI-assisted suggestions.");
  }
  // Real implementation: call the Anthropic Messages API here with a prompt
  // built from `request.kind` + `request.context`, and map the response
  // into `AiSuggestionResult.output`.
  throw new Error(`AI suggestion generation ("${request.kind}") is not yet implemented.`);
}
