-- Admin-only DELETE policies for projects, clients, and issues.
--
-- These three tables had no delete policy at all before this migration —
-- Postgres RLS defaults to denying an operation entirely when a table has
-- no policy for it, so any DELETE against these tables (even by an admin)
-- was silently rejected. tasks and files already had an equivalent
-- "org admin only" delete policy (see 0002_rls_policies.sql); this just
-- extends the same rule to the remaining top-level entities so the app's
-- new Delete buttons work.
--
-- Deleting a row here cascades to everything that references it via
-- "on delete cascade" in 0001_schema.sql:
--   - deleting a project also deletes its tasks, issues, files, topics,
--     approvals, project_members, and project_settings
--   - deleting a client also deletes all of that client's projects (and
--     therefore everything under those projects, per the line above) —
--     it does NOT delete the client's login/profile, only the client
--     record and their projects
--   - deleting an issue also deletes its own comments; it does not touch
--     any task it happened to reference

create policy projects_delete_admin on projects
  for delete using (organization_id = my_org_id() and is_admin());

create policy clients_delete_admin on clients
  for delete using (organization_id = my_org_id() and is_admin());

create policy issues_delete_admin on issues
  for delete using (organization_id = my_org_id() and is_admin());
