import type { ChatNotifierAdapter, ChatProvider } from "./types";

/**
 * Phase 4 chat-platform notifiers (spec section 53): mirror activity into
 * Slack, WhatsApp or Telegram. Each is a thin adapter behind the same
 * interface so src/lib/notifications/dispatch.ts can fan out to whichever
 * providers a profile/org has connected, alongside email.
 *
 * Real implementation notes:
 *  - Slack: an Incoming Webhook URL per workspace (simplest) or a full Slack
 *    App with `chat:write` scope for richer formatting.
 *  - WhatsApp: Meta's WhatsApp Business Cloud API, template messages only
 *    for the first contact in a 24h window.
 *  - Telegram: a bot token + the recipient's chat id (captured when they
 *    /start the bot).
 */
function stubAdapter(provider: ChatProvider): ChatNotifierAdapter {
  return {
    provider,
    async sendMessage(): Promise<void> {
      throw new Error(`${provider} isn't connected yet — this integration is coming soon.`);
    },
  };
}

export const slackAdapter = stubAdapter("slack");
export const whatsappAdapter = stubAdapter("whatsapp");
export const telegramAdapter = stubAdapter("telegram");
