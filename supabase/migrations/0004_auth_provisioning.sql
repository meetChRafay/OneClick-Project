-- ============================================================================
-- OneClick Project — auth provisioning trigger
--
-- Two real flows create a Supabase Auth user (auth.users row):
--   1. Self-serve signup — someone creates a brand-new agency workspace.
--   2. Admin invites a client — an existing admin invites someone by email.
--
-- Both need a matching `profiles` row (and, for an invited client, a
-- `clients` row too) created right alongside the auth user — and that has
-- to happen with elevated privileges, since a brand-new user has no
-- `profiles` row yet and therefore no `organization_id` for the RLS
-- policies in 0002_rls_policies.sql to key off of. A SECURITY DEFINER
-- trigger on auth.users is the standard Supabase pattern for this: it runs
-- with the privileges of the function owner (bypassing RLS), reads context
-- out of the auth user's metadata, and provisions everything atomically —
-- the metadata is set by the app when it calls supabase.auth.signUp() /
-- supabase.auth.admin.inviteUserByEmail() (see src/lib/actions/auth.ts and
-- src/lib/actions/clients.ts).
--
-- Expected metadata shapes (all keys land in auth.users.raw_user_meta_data
-- because they're passed as the `data` option on signUp/inviteUserByEmail):
--
--   New workspace (signup):
--     { "signup_type": "new_workspace", "full_name": "...", "organization_name": "..." }
--
--   Client invite:
--     { "signup_type": "client_invite", "full_name": "...", "organization_id": "...",
--       "company_name": "...", "project_id": "..." (optional) }
--
-- Apply after 0001/0002/0003.
-- ============================================================================

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  signup_type text := meta->>'signup_type';
  full_name text := coalesce(meta->>'full_name', split_part(new.email, '@', 1));
  new_org_id uuid;
  target_org_id uuid;
  new_client_id uuid;
  project_id uuid;
begin
  -- A profile might already exist if this trigger somehow fires twice
  -- (e.g. a retried webhook) — never double-provision.
  if exists (select 1 from profiles where id = new.id) then
    return new;
  end if;

  if signup_type = 'client_invite' then
    target_org_id := (meta->>'organization_id')::uuid;

    insert into profiles (id, organization_id, role, full_name, email, timezone, onboarding_completed)
    values (new.id, target_org_id, 'client', full_name, new.email, 'UTC', false);

    insert into clients (organization_id, profile_id, company_name)
    values (target_org_id, new.id, meta->>'company_name')
    returning id into new_client_id;

    project_id := nullif(meta->>'project_id', '')::uuid;
    if project_id is not null then
      insert into project_members (project_id, profile_id, role)
      values (project_id, new.id, 'client')
      on conflict (project_id, profile_id) do nothing;
    end if;

  else
    -- Default: a brand-new self-serve workspace. The person who signs up
    -- becomes that workspace's first admin.
    insert into organizations (name)
    values (coalesce(nullif(meta->>'organization_name', ''), full_name || '''s Workspace'))
    returning id into new_org_id;

    insert into profiles (id, organization_id, role, full_name, email, timezone, onboarding_completed)
    values (new.id, new_org_id, 'admin', full_name, new.email, 'UTC', false);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_auth_user();
