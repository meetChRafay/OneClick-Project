import type { EmailAdapter, EmailMessage } from "./types";

/**
 * Org-wide fallback email adapter, used for any recipient whose org hasn't
 * connected Gmail (see gmail.ts for the per-user alternative). Plugs into
 * src/lib/notifications/dispatch.ts — every repo.createNotification() call
 * across src/lib/actions/*.ts is the trigger point: dispatch() should read
 * the recipient's `notification_prefs.email` (Settings → Notifications) and,
 * if enabled, render + send through whichever adapter applies.
 *
 * Real implementation notes:
 *  - Any transactional provider works behind this interface — Resend,
 *    Postmark and SES all map cleanly onto `send()`.
 *  - Template the HTML from the Notification's `type`/`title`/`body`/`link`
 *    fields; keep a text fallback for deliverability.
 */
export const transactionalEmailAdapter: EmailAdapter = {
  async send(message: EmailMessage): Promise<void> {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[email:stub] would send "${message.subject}" to ${message.to}`);
      return;
    }
    throw new Error(
      "No email provider is configured. Set RESEND_API_KEY (or another provider's credentials) to enable outbound email."
    );
  },
};
