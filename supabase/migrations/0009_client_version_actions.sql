-- Lets the CLIENT (not just admin) move a version to "Revision Requested"
-- or "Approved / Final" themselves — a real action, not just a comment.
-- Admins can already update everything via task_versions_write_admin; this
-- adds a second policy (policies combine with OR) that lets a non-admin
-- update a version too, but the with-check clause locks down WHAT they're
-- allowed to set status to, so a client can't sneak in "draft" or edit the
-- other fields to something outside this allowed pair.
create policy task_versions_update_client on task_versions
  for update using (
    exists (select 1 from tasks t where t.id = task_id and can_access_project(t.project_id))
  )
  with check (
    exists (select 1 from tasks t where t.id = task_id and can_access_project(t.project_id))
    and (is_admin() or status in ('revision_requested', 'approved_final'))
  );
