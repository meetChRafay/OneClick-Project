import type { EmailAdapter, EmailMessage } from "./types";

/**
 * Per-user Gmail adapter (spec section 14): once an admin connects Gmail
 * from Settings → Integrations, client-facing notifications are sent from
 * their own inbox instead of a generic no-reply address — this is what
 * makes emails feel personal rather than automated.
 *
 * Real implementation notes:
 *  - OAuth scope: "https://www.googleapis.com/auth/gmail.send" (send-only —
 *    never read access).
 *  - Uses the Gmail API's `users.messages.send` with a base64url-encoded
 *    MIME message so it appears in the sender's own Sent folder.
 */
export function createGmailAdapter(accountEmail: string): EmailAdapter {
  return {
    async send(message: EmailMessage): Promise<void> {
      throw new Error(
        `Gmail isn't connected for ${accountEmail}. Connect it from Settings → Integrations to send "${message.subject}".`
      );
    },
  };
}
