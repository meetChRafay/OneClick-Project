-- ============================================================================
-- OneClick Project — payments / invoicing (added after 0001/0002; this
-- feature didn't exist yet when those were first written). Mirrors the
-- `Payment` interface in src/types/domain.ts exactly.
--
-- Apply this AFTER 0001_schema.sql and 0002_rls_policies.sql have already
-- been run. Safe to run once; re-running will error on the duplicate type/
-- table (drop first if you need to re-apply during development).
-- ============================================================================

create type payment_status as enum ('draft', 'sent', 'paid', 'overdue', 'cancelled');

-- The Payments feature also added two notification types and one activity
-- entity type after 0001_schema.sql's enums were first written — add them
-- here so createNotification/logActivity can use them.
alter type notification_type add value if not exists 'invoice_sent';
alter type notification_type add value if not exists 'payment_received';
alter type activity_entity_type add value if not exists 'payment';

create table payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  invoice_number text not null,
  description text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  status payment_status not null default 'draft',
  issued_date date not null,
  due_date date not null,
  paid_date date,
  payment_method text,
  notes_internal text, -- admin-only, never exposed to the client (mirrors clients.notes_internal)
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  unique (organization_id, invoice_number)
);
create index payments_org_idx on payments (organization_id);
create index payments_project_idx on payments (project_id);
create index payments_client_idx on payments (client_id);
create index payments_status_idx on payments (status);

-- ---------------------------------------------------------------------------
-- Row-level security — same rule of thumb as everywhere else: admins see
-- everything in their org; a client sees only payments on projects they're a
-- member of, and only once status has moved past 'draft' (an unsent invoice
-- is a draft an admin is still preparing, matching the Payments page's own
-- role-scoped visibility rule).
-- ---------------------------------------------------------------------------

alter table payments enable row level security;

create policy payments_select on payments
  for select using (
    organization_id = my_org_id()
    and can_access_project(project_id)
    and (is_admin() or status != 'draft')
  );

create policy payments_insert_admin on payments
  for insert with check (organization_id = my_org_id() and is_admin());

create policy payments_update_admin on payments
  for update using (organization_id = my_org_id() and is_admin());
