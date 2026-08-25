/**
 * Phase 3/4 integration architecture (spec sections 12–14, 53).
 *
 * These interfaces define the contracts the product is built against today
 * via the mock adapters in this directory. Swapping a mock for the real
 * provider (Google, Slack, an email provider, an LLM) never touches UI code
 * or server actions — only the adapter implementation changes, exactly like
 * the Repository pattern in src/lib/data.
 *
 * None of these are wired into the live notification/comment flow yet — see
 * each file's header comment for the specific spot it plugs into.
 */

export interface CalendarEventDraft {
  title: string;
  start: string; // ISO 8601
  end: string;
  location?: string | null;
  attendeeEmails: string[];
  description?: string | null;
}

/**
 * Two-way Google Calendar sync (spec section 13). Per-user: each admin (and
 * optionally each client) connects their own calendar via OAuth from
 * Settings → Integrations. Free/busy exposure rule: when a project member
 * hasn't connected their calendar, or when rendering another person's
 * schedule to someone outside their org, only "busy"/"available" blocks are
 * ever exposed — never event titles, attendees or descriptions.
 */
export interface CalendarSyncAdapter {
  /** Pushes a locally-created CalendarEvent to the provider, returns its remote event id. */
  createEvent(accountEmail: string, draft: CalendarEventDraft): Promise<{ providerEventId: string }>;
  updateEvent(accountEmail: string, providerEventId: string, draft: Partial<CalendarEventDraft>): Promise<void>;
  deleteEvent(accountEmail: string, providerEventId: string): Promise<void>;
  /** Free/busy only — see the exposure rule above. Never returns event details. */
  getFreeBusy(accountEmail: string, from: string, to: string): Promise<{ start: string; end: string }[]>;
}

/**
 * Google Drive sync (spec section 12): auto-creates a per-project folder
 * structure and mirrors uploaded files so admins don't have to upload
 * through the app manually.
 */
export interface DriveSyncAdapter {
  createProjectFolder(accountEmail: string, projectName: string): Promise<{ folderId: string; folderUrl: string }>;
  uploadFile(accountEmail: string, folderId: string, file: { name: string; mimeType: string; data: Buffer }): Promise<{ fileId: string; fileUrl: string }>;
}

export interface EmailMessage {
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
}

/**
 * Outbound transactional email. Two implementations are expected in
 * production: a per-user Gmail adapter (spec section 14 — client-facing
 * notifications sent from the admin's own inbox once they connect Gmail in
 * Settings) and an org-wide fallback (e.g. Resend/Postmark) for accounts
 * that haven't connected Gmail. Both satisfy this same interface so
 * src/lib/notifications/dispatch.ts never needs to know which is active.
 */
export interface EmailAdapter {
  send(message: EmailMessage): Promise<void>;
}

export type ChatProvider = "slack" | "whatsapp" | "telegram";

/**
 * Chat-platform notifications (spec section 53 phase 4 — mirror activity
 * into the tools a team already lives in). Each provider gets its own thin
 * adapter behind this one interface.
 */
export interface ChatNotifierAdapter {
  provider: ChatProvider;
  sendMessage(accountId: string, text: string, link?: string): Promise<void>;
}
