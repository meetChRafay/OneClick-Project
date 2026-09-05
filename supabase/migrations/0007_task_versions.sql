-- Per-task version history: a dated log of every cut of a video/file for a
-- task, e.g. "V1 draft", "V2 with client's requested changes", "V3 final
-- approved" — each with its own Google Drive link and notes. This is what
-- powers the "Versions" panel on a task's detail page.

create table task_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id),
  task_id uuid not null references tasks (id) on delete cascade,
  version_number integer not null,
  status text not null check (status in ('draft', 'sent_for_review', 'revision_requested', 'approved_final')),
  drive_url text,
  notes text,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

create index task_versions_task_idx on task_versions (task_id);

alter table task_versions enable row level security;

-- Anyone who can access the task's project can see its version history
-- (admin or the client on that project) — this is meant to be shown to the
-- client, e.g. "here's what changed in V2".
create policy task_versions_select on task_versions
  for select using (
    exists (
      select 1 from tasks t
      where t.id = task_id and can_access_project(t.project_id)
    )
  );

-- Only admins log new versions / change a version's status / remove one.
create policy task_versions_write_admin on task_versions
  for all using (
    exists (
      select 1 from tasks t
      where t.id = task_id and can_access_project(t.project_id) and is_admin()
    )
  )
  with check (
    exists (
      select 1 from tasks t
      where t.id = task_id and can_access_project(t.project_id) and is_admin()
    )
  );
