import { transactionalEmailAdapter } from "@/lib/integrations/email";
import { createGmailAdapter } from "@/lib/integrations/gmail";
import { DEFAULT_NOTIFICATION_PREFS } from "@/types/domain";
import type { Integration, Notification, Profile } from "@/types/domain";

/**
 * Fan-out point for a freshly-created Notification (spec section 53 phase 3).
 * Not called anywhere yet — repo.createNotification() only persists the
 * in-app row today, which is what powers the notification bell and the
 * Communication Center. Wiring this in is one line at each call site:
 *
 *   const notification = await repo.createNotification({ ... });
 *   await dispatchNotification(notification, recipientProfile, integrations);
 *
 * `recipientProfile.notification_prefs` (Settings → Notifications) gates
 * whether email goes out at all; per-user Gmail is preferred over the
 * org-wide fallback when connected (see integrations/gmail.ts).
 */
export async function dispatchNotification(
  notification: Notification,
  recipient: Profile,
  integrations: Integration[]
): Promise<void> {
  const prefs = recipient.notification_prefs ?? DEFAULT_NOTIFICATION_PREFS;
  if (!prefs.email) return;

  const gmail = integrations.find(
    (i) => i.provider === "gmail" && i.profile_id === recipient.id && i.connected && i.account_email
  );
  const adapter = gmail?.account_email ? createGmailAdapter(gmail.account_email) : transactionalEmailAdapter;

  await adapter.send({
    to: recipient.email,
    subject: notification.title,
    bodyText: notification.body ?? notification.title,
    bodyHtml: `<p>${notification.body ?? notification.title}</p>`,
  });

  // Chat notifiers (Slack/WhatsApp/Telegram) would fan out here too, once a
  // profile has one connected — see src/lib/integrations/chat.ts.
}
