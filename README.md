# Project Hub

A premium, full-featured project and client-communication platform for agencies and freelancers — one shared source of truth for projects, tasks, files, approvals, availability and communication with clients, replacing scattered WhatsApp threads, shared drives and email chains.

Built as a complete Next.js application: every module in the spec is implemented and fully interactive today, running on a realistic in-memory dataset with zero external services required. The data layer is architected so a real Supabase backend drops in without touching any UI code — see [Connecting a real backend](#connecting-a-real-backend) below.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The login page lists one-click demo accounts, or sign in with any of the emails below (no password is checked in the default mock backend):

| Name | Role | Email | Notes |
|---|---|---|---|
| Abdul Rafay | Admin | `abdul@nuxystudio.com` | Founder & Producer at Nuxy Studio (the agency) |
| Sara Malik | Admin | `sara@nuxystudio.com` | Video Editor |
| Constantin Mock | Client | `constantin@healthveins.tv` | Owns the Health YouTube Channel project |
| Elena Rossi | Client | `elena@bellaskincare.com` | Founder of Bella Skincare Co. |

Try both an admin and a client account — the whole app is role-scoped: clients only ever see their own projects, and only the comments/files an admin has marked client-visible.

## What's implemented

Every module from the product spec is built and interactive:

- **Dashboard** — role-specific: admins get a cross-project overview with health indicators and priority tasks; clients get a focused view of their own projects.
- **Projects** — full lifecycle (planning → active → completed → archived), a per-project workspace with Overview / Tasks / Topics / Files / Communication / Issues / Approvals / Activity tabs, and a computed health score (healthy / needs attention / at risk) based on overdue tasks, blocked work, open issues and pending approvals.
- **Tasks** — the "Waiting For" system (Me / Client / Both / Nobody) that answers "whose court is the ball in" at a glance, full status workflow, filters, and threaded comments with internal/client-visible toggling.
- **Topics & video workflow** — a 9-stage content pipeline board and a 16-stage detailed production workflow (idea → research → script → voiceover → edit → review → corrections → approval → publish), each topic showing its current stage.
- **Approvals** — a dedicated request/approve/request-changes flow with the decision cascading back onto the originating task.
- **Payments** — invoice/billing tracking per project: admins create invoices (amount, due date, description), send them to the client, and mark them paid; clients see their own invoices and status. Summary tiles (total paid, outstanding, overdue) on the Payments page and on both dashboards, plus a per-project Billing tab. Every invoice has a **Download PDF** button that streams a generated invoice document (org name, bill-to, invoice number, dates, line item, total, status) — real bytes, not a mock. This is a billing *tracker*, not a live payment gateway — no card data is collected and no money actually moves; "mark as paid" is a manual admin action standing in for what a Stripe/PayPal webhook would do in production.
- **Issues** — bug/blocker tracking, separate from tasks, with its own comment threads.
- **Files** — categorized, versioned, internal/client-visible file records (metadata today; real bytes once Supabase Storage or Google Drive is connected).
- **Availability** — weekly schedules, one-off exceptions, and a request/respond flow for scheduling calls across time zones.
- **Calendar** — month / week / agenda views unifying task deadlines, meetings, review sessions, publish dates and milestones, plus an event-creation flow.
- **Communication Center** — a unified, filterable feed (All / Unread / Mentions / Task / Issues / Client) of every comment and approval decision across a user's accessible projects, each item linking back to its source.
- **Clients** — an admin-only directory with an invitation flow, per-client internal notes (never visible to the client), and a rollup of their projects and health.
- **Settings** — profile, notification preferences, Google integrations (Drive / Calendar / Gmail, simulated connect flow), organization/team info, and a first-run onboarding checklist.
- **Activity** — an org-wide chronological audit trail.
- **Reports** (admin-only) — real charts built on live data: a 6-month invoiced-vs-collected revenue trend, revenue by client, and part-to-whole breakdowns of the task pipeline and project health, alongside a KPI row (collected, outstanding, active projects, task completion rate). The categorical chart colors (`--dataviz-*` tokens in `globals.css`, separate from the decorative `--chart-*` tokens) are validated for colorblind-safe separation and contrast against the card surface in both light and dark mode, not eyeballed.
- **Global search** (⌘K) across projects, tasks, topics, issues and files.

Every list page applies the same privacy rule via `src/lib/authz.ts`: a client's queries are scoped to their own projects, and internal-only items are filtered out before they ever reach the response.

## Architecture

**Data layer — the Repository pattern.** `src/lib/data/repository.ts` defines a single `Repository` interface (~50 methods) that every page and Server Action goes through via `getRepository()` (`src/lib/data/index.ts`). Two implementations exist:

- **Mock** (`src/lib/data/mock/`) — an in-memory store seeded with the realistic dataset described above, kept alive across Next.js dev-server hot reloads via a `globalThis` singleton. This is the default (`DATA_BACKEND=mock` or unset) and is what makes the whole app work today with zero setup.
- **Supabase** (`src/lib/data/supabase/`) — talks to a real Postgres/Supabase project using the schema in `supabase/migrations/`. The Supabase client setup (`client.ts`) is complete; the adapter itself (`adapter.ts`) is an intentional stub — see [Connecting a real backend](#connecting-a-real-backend).

Because every page calls `getRepository()` rather than either implementation directly, finishing the Supabase adapter is the *only* change needed to move off the mock data — no UI or Server Action code changes.

**Access control.** `src/lib/authz.ts` provides `getAccessibleProjectIds()` and `visibleToRole()`, applied consistently across every list/detail page to enforce that clients only see their own projects and only client-visible content. `supabase/migrations/0002_rls_policies.sql` enforces the same rule at the database level for defense-in-depth.

**Server Actions.** All mutations (`src/lib/actions/*.ts`) are Next.js Server Actions (`"use server"`). Client Components call them directly, or receive them pre-bound with server-only context via an inline `"use server"` closure defined in the parent Server Component (see `CommentThread`'s usage in the task/issue detail pages).

**UI.** Hand-built shadcn/ui-equivalent primitives (`src/components/ui/`) on Radix UI + Tailwind CSS v4 + `class-variance-authority`, with `next-themes` for light/dark/system theming. No external font or CDN dependencies.

## Connecting a real backend

1. Create a Supabase project.
2. Run the two migrations in `supabase/migrations/` in order (`supabase db push`, or paste each into the SQL editor): `0001_schema.sql` creates every table, enum and index; `0002_rls_policies.sql` enables row-level security matching the client/admin visibility rules described above. These haven't been run against a live database in this environment — review and test them before pointing production traffic at them.
3. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and set `DATA_BACKEND=supabase`.
4. Implement `src/lib/data/supabase/adapter.ts` — it currently throws a clear "not yet implemented" error for every method; `src/lib/data/mock/adapter.ts` is the reference implementation to port method-by-method against the schema in step 2.

## What's intentionally not wired up

Per the spec, these are architecture-only — interfaces and clearly-documented stub implementations exist, but nothing calls a real external API, and no cost is incurred running this app:

- **Google Drive / Calendar / Gmail** — `src/lib/integrations/google-*.ts`. Settings → Integrations has a fully working *simulated* connect/disconnect flow (it records an account email and flips `connected: true`); swap the stub bodies for real OAuth + API calls to go live.
- **Slack / WhatsApp / Telegram** — `src/lib/integrations/chat.ts`, shown as "coming soon" in Settings.
- **Outbound email** — `src/lib/integrations/email.ts` + `gmail.ts`, fanned out from `src/lib/notifications/dispatch.ts`. Notification preferences (Settings → Notifications) are fully persisted; the dispatch function that would actually send email isn't called from the notification-creation call sites yet.
- **AI features** — `src/lib/integrations/ai.ts` and `POST /api/ai/suggest`, both return a clear "not configured" response unless `ANTHROPIC_API_KEY` is set. No AI call is ever made by default.

## Project structure

```
src/
  app/(auth)/          Login, signup, password reset, invitation acceptance
  app/(app)/            Every authenticated module (one folder per route)
  app/api/               Stub API routes (currently just /api/ai/suggest)
  components/            UI primitives (ui/), shell chrome (shell/), and one folder per feature
  lib/actions/            Server Actions, one file per domain area
  lib/data/                 Repository interface + mock and Supabase adapters
  lib/integrations/       Phase 3/4 adapter interfaces (Google, chat, AI, email)
  lib/authz.ts             Client/admin visibility scoping, used by every list page
  types/domain.ts          Source of truth for every entity shape (mirrors the SQL schema)
supabase/migrations/     SQL schema + row-level security policies
```

## Scripts

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run start    # run a production build
npm run lint     # eslint
npx tsc --noEmit # typecheck
```

## Tech stack

Next.js 16 (App Router, Server Actions, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · Radix UI · Supabase (`@supabase/ssr`, `@supabase/supabase-js`) · `next-themes` · `date-fns` · `sonner` · `cmdk` · `pdf-lib` (invoice PDFs) · `recharts` (Reports).
