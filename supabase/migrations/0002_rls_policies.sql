-- ============================================================================
-- OneClick Project — row-level security (spec sections 3, 41, 42)
--
-- Rule of thumb enforced everywhere below: an admin sees everything inside
-- their own organization; a client sees only their own projects (via
-- project_members), and within those, only `client_visible` comments/files
-- — never `internal` ones, and never another client's data or an admin's
-- private notes about them (clients.notes_internal).
--
-- RLS here is defense-in-depth, not the only gate — the server actions in
-- src/lib/actions/*.ts already check role/ownership before writing. Treat
-- these policies as what protects the database if a request ever reaches
-- Postgres directly (e.g. a future client-side Supabase query).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper functions. SECURITY DEFINER + fixed search_path so they can read
-- `profiles`/`project_members` without recursing into these same RLS
-- policies (a plain query from inside a USING clause would otherwise apply
-- profiles' own RLS and could deadlock/recurse).
-- ---------------------------------------------------------------------------

create or replace function my_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false);
$$;

-- True if the current user can see the given project: an admin in the same
-- org, or a client/contributor who's a member of it.
create or replace function can_access_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from projects p
      where p.id = p_project_id
        and p.organization_id = my_org_id()
        and (
          is_admin()
          or exists (
            select 1 from project_members pm
            where pm.project_id = p.id and pm.profile_id = auth.uid()
          )
        )
    );
$$;

grant execute on function my_org_id() to authenticated;
grant execute on function is_admin() to authenticated;
grant execute on function can_access_project(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------

alter table organizations enable row level security;

create policy organizations_select on organizations
  for select using (id = my_org_id());

create policy organizations_update on organizations
  for update using (id = my_org_id() and is_admin());

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;

-- Admins see their whole org; anyone can see their own row; clients can see
-- profiles of people who share at least one project with them (so comment
-- authors, assignees, etc. resolve to real names).
create policy profiles_select on profiles
  for select using (
    organization_id = my_org_id()
    and (
      is_admin()
      or id = auth.uid()
      or exists (
        select 1 from project_members mine
        join project_members theirs on theirs.project_id = mine.project_id
        where mine.profile_id = auth.uid() and theirs.profile_id = profiles.id
      )
    )
  );

create policy profiles_update_self on profiles
  for update using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- clients (the agency's Client records — distinct from the client's own
-- profile). Never exposed to the client themselves: notes_internal is
-- admin-only per spec, and this build's Clients module is an admin-only
-- route, so clients get no direct access to this table at all.
-- ---------------------------------------------------------------------------

alter table clients enable row level security;

create policy clients_select_admin on clients
  for select using (organization_id = my_org_id() and is_admin());

create policy clients_insert_admin on clients
  for insert with check (organization_id = my_org_id() and is_admin());

create policy clients_update_admin on clients
  for update using (organization_id = my_org_id() and is_admin());

-- ---------------------------------------------------------------------------
-- projects / project_members / project_settings
-- ---------------------------------------------------------------------------

alter table projects enable row level security;

create policy projects_select on projects
  for select using (organization_id = my_org_id() and can_access_project(id));

create policy projects_insert_admin on projects
  for insert with check (organization_id = my_org_id() and is_admin());

create policy projects_update_admin on projects
  for update using (organization_id = my_org_id() and is_admin());

alter table project_members enable row level security;

create policy project_members_select on project_members
  for select using (can_access_project(project_id));

create policy project_members_write_admin on project_members
  for all using (
    exists (select 1 from projects p where p.id = project_id and p.organization_id = my_org_id() and is_admin())
  );

alter table project_settings enable row level security;

create policy project_settings_select on project_settings
  for select using (can_access_project(project_id));

create policy project_settings_write_admin on project_settings
  for all using (
    exists (select 1 from projects p where p.id = project_id and p.organization_id = my_org_id() and is_admin())
  );

-- ---------------------------------------------------------------------------
-- tags / topics / topic_stage_history
-- ---------------------------------------------------------------------------

alter table tags enable row level security;

create policy tags_select on tags
  for select using (organization_id = my_org_id());

create policy tags_write_admin on tags
  for all using (organization_id = my_org_id() and is_admin());

alter table topics enable row level security;

create policy topics_select on topics
  for select using (organization_id = my_org_id() and can_access_project(project_id));

create policy topics_write_admin on topics
  for all using (organization_id = my_org_id() and is_admin());

-- Internal workflow history — not surfaced to clients in the product today.
alter table topic_stage_history enable row level security;

create policy topic_stage_history_select_admin on topic_stage_history
  for select using (
    exists (select 1 from topics t where t.id = topic_id and t.organization_id = my_org_id() and is_admin())
  );

create policy topic_stage_history_insert_admin on topic_stage_history
  for insert with check (
    exists (select 1 from topics t where t.id = topic_id and t.organization_id = my_org_id() and is_admin())
  );

-- ---------------------------------------------------------------------------
-- tasks / task_tags / task_comments / task_attachments
-- ---------------------------------------------------------------------------

alter table tasks enable row level security;

create policy tasks_select on tasks
  for select using (organization_id = my_org_id() and can_access_project(project_id));

create policy tasks_insert on tasks
  for insert with check (organization_id = my_org_id() and can_access_project(project_id));

create policy tasks_update on tasks
  for update using (organization_id = my_org_id() and can_access_project(project_id));

create policy tasks_delete_admin on tasks
  for delete using (organization_id = my_org_id() and is_admin());

alter table task_tags enable row level security;

create policy task_tags_select on task_tags
  for select using (exists (select 1 from tasks t where t.id = task_id and can_access_project(t.project_id)));

create policy task_tags_write_admin on task_tags
  for all using (
    exists (select 1 from tasks t where t.id = task_id and can_access_project(t.project_id) and is_admin())
  );

alter table task_comments enable row level security;

-- Clients only ever see (or post) client_visible comments; admins see everything.
create policy task_comments_select on task_comments
  for select using (
    exists (
      select 1 from tasks t
      where t.id = task_id
        and can_access_project(t.project_id)
        and (is_admin() or visibility = 'client_visible')
    )
  );

create policy task_comments_insert on task_comments
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from tasks t
      where t.id = task_id
        and can_access_project(t.project_id)
        and (is_admin() or visibility = 'client_visible')
    )
  );

alter table task_attachments enable row level security;

create policy task_attachments_select on task_attachments
  for select using (exists (select 1 from tasks t where t.id = task_id and can_access_project(t.project_id)));

create policy task_attachments_write_admin on task_attachments
  for all using (
    exists (select 1 from tasks t where t.id = task_id and can_access_project(t.project_id) and is_admin())
  );

-- ---------------------------------------------------------------------------
-- issues / issue_comments
-- ---------------------------------------------------------------------------

alter table issues enable row level security;

create policy issues_select on issues
  for select using (organization_id = my_org_id() and can_access_project(project_id));

create policy issues_insert on issues
  for insert with check (organization_id = my_org_id() and can_access_project(project_id));

create policy issues_update on issues
  for update using (organization_id = my_org_id() and can_access_project(project_id));

alter table issue_comments enable row level security;

create policy issue_comments_select on issue_comments
  for select using (
    exists (
      select 1 from issues i
      where i.id = issue_id
        and can_access_project(i.project_id)
        and (is_admin() or visibility = 'client_visible')
    )
  );

create policy issue_comments_insert on issue_comments
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from issues i
      where i.id = issue_id
        and can_access_project(i.project_id)
        and (is_admin() or visibility = 'client_visible')
    )
  );

-- ---------------------------------------------------------------------------
-- files
-- ---------------------------------------------------------------------------

alter table files enable row level security;

create policy files_select on files
  for select using (
    organization_id = my_org_id()
    and can_access_project(project_id)
    and (is_admin() or visibility = 'client_visible')
  );

create policy files_insert on files
  for insert with check (
    organization_id = my_org_id()
    and can_access_project(project_id)
    and (
      is_admin()
      or exists (
        select 1 from project_settings ps where ps.project_id = files.project_id and ps.client_can_upload
      )
    )
  );

create policy files_delete_admin on files
  for delete using (organization_id = my_org_id() and is_admin());

-- ---------------------------------------------------------------------------
-- approvals
-- ---------------------------------------------------------------------------

alter table approvals enable row level security;

create policy approvals_select on approvals
  for select using (organization_id = my_org_id() and can_access_project(project_id));

create policy approvals_insert_admin on approvals
  for insert with check (organization_id = my_org_id() and is_admin());

-- Both an admin (re-requesting) and the client (deciding) can update.
create policy approvals_update on approvals
  for update using (organization_id = my_org_id() and can_access_project(project_id));

-- ---------------------------------------------------------------------------
-- availability / temporary_availability / availability_requests
-- ---------------------------------------------------------------------------

alter table availability enable row level security;

create policy availability_select on availability
  for select using (
    profile_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = availability.profile_id and p.organization_id = my_org_id()
      and (
        is_admin()
        or exists (
          select 1 from project_members mine
          join project_members theirs on theirs.project_id = mine.project_id
          where mine.profile_id = auth.uid() and theirs.profile_id = availability.profile_id
        )
      )
    )
  );

create policy availability_write_self on availability
  for all using (profile_id = auth.uid());

alter table temporary_availability enable row level security;

create policy temporary_availability_select on temporary_availability
  for select using (
    profile_id = auth.uid()
    or exists (
      select 1 from profiles p where p.id = temporary_availability.profile_id and p.organization_id = my_org_id() and is_admin()
    )
  );

create policy temporary_availability_write_self on temporary_availability
  for all using (profile_id = auth.uid());

alter table availability_requests enable row level security;

create policy availability_requests_select on availability_requests
  for select using (
    organization_id = my_org_id()
    and (requested_by = auth.uid() or requested_of = auth.uid() or is_admin())
  );

create policy availability_requests_insert on availability_requests
  for insert with check (organization_id = my_org_id() and requested_by = auth.uid());

create policy availability_requests_update on availability_requests
  for update using (
    organization_id = my_org_id()
    and (requested_of = auth.uid() or requested_by = auth.uid() or is_admin())
  );

-- ---------------------------------------------------------------------------
-- calendar_events
-- ---------------------------------------------------------------------------

alter table calendar_events enable row level security;

create policy calendar_events_select on calendar_events
  for select using (
    organization_id = my_org_id()
    and (project_id is null or can_access_project(project_id))
    and (is_admin() or auth.uid() = any (attendee_ids) or project_id is not null)
  );

create policy calendar_events_write_admin on calendar_events
  for all using (organization_id = my_org_id() and is_admin());

-- ---------------------------------------------------------------------------
-- notifications (always private to the recipient)
-- ---------------------------------------------------------------------------

alter table notifications enable row level security;

create policy notifications_select_own on notifications
  for select using (profile_id = auth.uid());

create policy notifications_update_own on notifications
  for update using (profile_id = auth.uid());

create policy notifications_insert on notifications
  for insert with check (organization_id = my_org_id());

-- ---------------------------------------------------------------------------
-- activity_log
-- ---------------------------------------------------------------------------

alter table activity_log enable row level security;

create policy activity_log_select on activity_log
  for select using (
    organization_id = my_org_id()
    and (project_id is null or can_access_project(project_id))
    and (is_admin() or project_id is not null)
  );

create policy activity_log_insert on activity_log
  for insert with check (organization_id = my_org_id());

-- ---------------------------------------------------------------------------
-- integrations (org-wide rows have profile_id null; per-user rows are
-- private to that user and to admins)
-- ---------------------------------------------------------------------------

alter table integrations enable row level security;

create policy integrations_select on integrations
  for select using (
    organization_id = my_org_id()
    and (profile_id is null or profile_id = auth.uid() or is_admin())
  );

create policy integrations_write_admin on integrations
  for all using (organization_id = my_org_id() and is_admin());
