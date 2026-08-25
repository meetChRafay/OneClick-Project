import type { CalendarSyncAdapter } from "./types";

/**
 * Stub Google Calendar adapter. Plugs into
 * src/lib/actions/calendar.ts#createCalendarEventAction once a real
 * implementation exists: after repo.createCalendarEvent() succeeds, call
 * googleCalendarAdapter.createEvent() when the acting user has a connected
 * `google_calendar` Integration row, and persist the returned
 * providerEventId back onto the CalendarEvent.
 *
 * Real implementation notes:
 *  - OAuth: googleapis' `google.auth.OAuth2`, scope
 *    "https://www.googleapis.com/auth/calendar.events" (write) or
 *    ".../calendar.freebusy" (read-only, for getFreeBusy).
 *  - Tokens live on the Integration row's `metadata` (refresh_token,
 *    access_token, expiry) — never in the profile itself.
 *  - getFreeBusy must call the freebusy.query endpoint, not events.list, so
 *    the app never even receives event details for other people's calendars.
 */
export const googleCalendarAdapter: CalendarSyncAdapter = {
  async createEvent(): Promise<{ providerEventId: string }> {
    throw new Error(
      "Google Calendar isn't connected in this environment. Connect it from Settings → Integrations once GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET are configured."
    );
  },
  async updateEvent(): Promise<void> {
    throw new Error("Google Calendar sync is not configured.");
  },
  async deleteEvent(): Promise<void> {
    throw new Error("Google Calendar sync is not configured.");
  },
  async getFreeBusy(): Promise<{ start: string; end: string }[]> {
    throw new Error("Google Calendar sync is not configured.");
  },
};
