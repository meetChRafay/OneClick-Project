-- ============================================================================
-- Project Hub — core schema (spec section 40)
--
-- Mirrors src/types/domain.ts exactly. Every table here has a corresponding
-- TypeScript interface — if you change one, change the other. The
-- Repository interface (src/lib/data/repository.ts) is what the app code
-- actually talks to; src/lib/data/supabase/adapter.ts is where these tables
-- get wired up to it.
--
-- Apply with `supabase db push` or paste into the SQL editor, in order:
--   0001_schema.sql   (this file — tables, enums, indexes, triggers)
--   0002_rls_policies.sql (row-level security)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type user_role as enum ('admin', 'client');
create type project_status as enum ('planning', 'active', 'needs_attention', 'on_hold', 'completed', 'archived');
create type priority as enum ('low', 'medium', 'high', 'urgent');
create type project_member_role as enum ('owner', 'manager', 'contributor', 'client');
create type task_status as enum (
  'not_started', 'in_progress', 'internal_review', 'client_review', 'waiting_client',
  'waiting_me', 'corrections_required', 'blocked', 'final_approval', 'completed', 'cancelled'
);
create type waiting_for as enum ('me', 'client', 'both', 'nobody');
create type visibility as enum ('internal', 'client_visible');
create type content_pipeline_stage as enum (
  'ideas', 'research', 'script', 'voiceover', 'editing', 'review', 'corrections', 'approved', 'published'
);
create type video_workflow_stage as enum (
  'topic_idea', 'topic_approved', 'research', 'script', 'script_review', 'voiceover',
  'visual_production', 'editing', 'internal_review', 'client_review', 'corrections',
  'final_approval', 'thumbnail', 'seo', 'upload', 'published'
);
create type topic_status as enum ('idea', 'ready_to_start', 'in_progress', 'in_review', 'published');
create type issue_status as enum ('open', 'in_progress', 'waiting', 'resolved', 'closed');
create type file_category as enum ('videos', 'scripts', 'voiceovers', 'images', 'thumbnails', 'documents', 'references', 'other');
create type approval_status as enum ('waiting_client', 'approved', 'changes_requested');
create type availability_status as enum ('available', 'busy', 'away', 'dnd');
create type availability_request_status as enum ('pending', 'accepted', 'declined', 'rescheduled');
create type calendar_event_type as enum ('task_deadline', 'meeting', 'review_session', 'publish_date', 'milestone', 'availability_block');
create type notification_type as enum (
  'task_assigned', 'task_new', 'deadline_approaching', 'task_overdue', 'new_comment', 'mention',
  'new_file', 'approval_request', 'approval_received', 'availability_request', 'issue_created',
  'issue_resolved', 'project_update'
);
create type activity_entity_type as enum ('project', 'task', 'topic', 'issue', 'file', 'approval', 'availability', 'client');
create type integration_provider as enum ('google_drive', 'google_calendar', 'gmail', 'google_meet', 'slack', 'whatsapp', 'telegram', 'email');

-- ---------------------------------------------------------------------------
-- Organizations & people
-- ---------------------------------------------------------------------------

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- profiles.id = auth.users.id (1:1 with a Supabase Auth user)
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  role user_role not null default 'client',
  full_name text not null,
  email text not null,
  avatar_url text,
  title text,
  timezone text not null default 'UTC',
  phone text,
  onboarding_completed boolean not null default false,
  notification_prefs jsonb,
  created_at timestamptz not null default now()
);
create index profiles_org_idx on profiles (organization_id);

create table clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  company_name text,
  notes_internal text, -- admin-only, never exposed to the client themselves
  created_at timestamptz not null default now(),
  unique (profile_id)
);
create index clients_org_idx on clients (organization_id);

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------

create table projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  description text,
  client_id uuid not null references clients (id) on delete cascade,
  status project_status not null default 'planning',
  priority priority not null default 'medium',
  start_date date,
  deadline date,
  progress smallint not null default 0 check (progress between 0 and 100),
  cover_color text,
  drive_folder_id text,
  drive_folder_url text,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
create index projects_org_idx on projects (organization_id);
create index projects_client_idx on projects (client_id);
create index projects_status_idx on projects (status);

create table project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  role project_member_role not null default 'contributor',
  created_at timestamptz not null default now(),
  unique (project_id, profile_id)
);
create index project_members_project_idx on project_members (project_id);
create index project_members_profile_idx on project_members (profile_id);

create table project_settings (
  project_id uuid primary key references projects (id) on delete cascade,
  drive_structure_created boolean not null default false,
  client_can_upload boolean not null default true,
  client_can_see_internal_notes boolean not null default false,
  notify_on_client_comment boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------

create table tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  color text not null,
  unique (organization_id, name)
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  title text not null,
  description text,
  status topic_status not null default 'idea',
  pipeline_stage content_pipeline_stage not null default 'ideas',
  workflow_stage video_workflow_stage not null default 'topic_idea',
  assignee_id uuid references profiles (id),
  priority priority not null default 'medium',
  expected_start date,
  published_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index topics_project_idx on topics (project_id);

create table topic_stage_history (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics (id) on delete cascade,
  stage video_workflow_stage not null,
  entered_at timestamptz not null default now(),
  entered_by uuid not null references profiles (id)
);
create index topic_stage_history_topic_idx on topic_stage_history (topic_id);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  topic_id uuid references topics (id) on delete set null,
  title text not null,
  description text,
  assignee_id uuid references profiles (id),
  creator_id uuid not null references profiles (id),
  status task_status not null default 'not_started',
  priority priority not null default 'medium',
  deadline timestamptz,
  start_date date,
  estimated_minutes integer,
  actual_minutes integer,
  waiting_for waiting_for not null default 'nobody',
  waiting_for_profile_id uuid references profiles (id),
  position integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_org_idx on tasks (organization_id);
create index tasks_project_idx on tasks (project_id);
create index tasks_assignee_idx on tasks (assignee_id);
create index tasks_status_idx on tasks (status);
create index tasks_deadline_idx on tasks (deadline);

create table task_tags (
  task_id uuid not null references tasks (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (task_id, tag_id)
);

create table task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  author_id uuid not null references profiles (id),
  body text not null,
  visibility visibility not null default 'client_visible',
  mentioned_profile_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index task_comments_task_idx on task_comments (task_id);

create table task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  file_id uuid not null, -- references files(id), added after files table below
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Issues
-- ---------------------------------------------------------------------------

create table issues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  task_id uuid references tasks (id) on delete set null,
  title text not null,
  description text,
  priority priority not null default 'medium',
  status issue_status not null default 'open',
  assignee_id uuid references profiles (id),
  reporter_id uuid not null references profiles (id),
  deadline timestamptz,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index issues_project_idx on issues (project_id);
create index issues_status_idx on issues (status);

create table issue_comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues (id) on delete cascade,
  author_id uuid not null references profiles (id),
  body text not null,
  visibility visibility not null default 'client_visible',
  created_at timestamptz not null default now()
);
create index issue_comments_issue_idx on issue_comments (issue_id);

-- ---------------------------------------------------------------------------
-- Files
-- ---------------------------------------------------------------------------

create table files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  name text not null,
  category file_category not null default 'other',
  visibility visibility not null default 'client_visible',
  size_bytes bigint,
  mime_type text,
  storage_path text, -- Supabase Storage object path
  drive_file_id text,
  drive_url text,
  uploaded_by uuid not null references profiles (id),
  version integer not null default 1,
  created_at timestamptz not null default now()
);
create index files_project_idx on files (project_id);
create index files_category_idx on files (category);

alter table task_attachments add constraint task_attachments_file_fk foreign key (file_id) references files (id) on delete cascade;
create index task_attachments_task_idx on task_attachments (task_id);

-- ---------------------------------------------------------------------------
-- Approvals
-- ---------------------------------------------------------------------------

create table approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  task_id uuid references tasks (id) on delete set null,
  topic_id uuid references topics (id) on delete set null,
  file_id uuid references files (id) on delete set null,
  title text not null,
  status approval_status not null default 'waiting_client',
  requested_by uuid not null references profiles (id),
  decided_by uuid references profiles (id),
  feedback text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index approvals_project_idx on approvals (project_id);
create index approvals_status_idx on approvals (status);

-- ---------------------------------------------------------------------------
-- Availability
-- ---------------------------------------------------------------------------

create table availability (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  status availability_status not null default 'available',
  status_message text,
  timezone text not null default 'UTC',
  weekly_schedule jsonb not null default '[]',
  updated_at timestamptz not null default now(),
  unique (profile_id)
);

create table temporary_availability (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  date date not null,
  "start" time not null,
  "end" time not null,
  note text,
  created_at timestamptz not null default now()
);
create index temporary_availability_profile_idx on temporary_availability (profile_id);

create table availability_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  project_id uuid references projects (id) on delete set null,
  requested_by uuid not null references profiles (id),
  requested_of uuid not null references profiles (id),
  date date not null,
  "start" time not null,
  "end" time not null,
  purpose text not null,
  status availability_request_status not null default 'pending',
  response_note text,
  proposed_alternative jsonb,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);
create index availability_requests_requested_of_idx on availability_requests (requested_of);

-- ---------------------------------------------------------------------------
-- Calendar
-- ---------------------------------------------------------------------------

create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  project_id uuid references projects (id) on delete cascade,
  title text not null,
  type calendar_event_type not null default 'meeting',
  "start" timestamptz not null,
  "end" timestamptz not null,
  all_day boolean not null default false,
  location text,
  attendee_ids uuid[] not null default '{}',
  google_event_id text,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);
create index calendar_events_org_idx on calendar_events (organization_id);
create index calendar_events_project_idx on calendar_events (project_id);
create index calendar_events_start_idx on calendar_events ("start");

-- ---------------------------------------------------------------------------
-- Notifications & activity
-- ---------------------------------------------------------------------------

create table notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  actor_id uuid references profiles (id),
  created_at timestamptz not null default now()
);
create index notifications_profile_idx on notifications (profile_id, read);

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  project_id uuid references projects (id) on delete cascade,
  entity_type activity_entity_type not null,
  entity_id uuid not null,
  actor_id uuid not null references profiles (id),
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index activity_log_org_idx on activity_log (organization_id, created_at desc);
create index activity_log_project_idx on activity_log (project_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Integrations
-- ---------------------------------------------------------------------------

create table integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  profile_id uuid references profiles (id) on delete cascade, -- null = org-wide (e.g. Drive)
  provider integration_provider not null,
  connected boolean not null default false,
  account_email text,
  scopes text[],
  metadata jsonb,
  connected_at timestamptz,
  unique (organization_id, provider, profile_id)
);

-- ---------------------------------------------------------------------------
-- updated_at trigger (tasks is the only table the app treats as mutable
-- enough to need this today; add more as needed)
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_set_updated_at
  before update on tasks
  for each row
  execute function set_updated_at();
