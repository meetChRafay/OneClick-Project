-- Extra fields on task_versions: priority / waiting_for / deadline, so each
-- version can carry its own urgency and who's currently holding it up —
-- mirrors the same three fields tasks already have.
alter table task_versions
  add column priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  add column waiting_for text not null default 'nobody' check (waiting_for in ('me', 'client', 'both', 'nobody')),
  add column deadline timestamptz;

-- Feedback thread on ONE specific version — "what needs to change in this
-- cut" — with an optional category tag (what kind of revision) and an
-- optional image (e.g. a screenshot with an arrow pointing at what to fix).
-- Both admin and client can post here.
create table task_version_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id),
  version_id uuid not null references task_versions (id) on delete cascade,
  task_id uuid not null references tasks (id) on delete cascade,
  author_id uuid not null references profiles (id),
  body text not null default '',
  category text check (category in ('video_length', 'audio', 'visuals_color', 'captions_text', 'thumbnail', 'other')),
  image_url text,
  visibility text not null default 'client_visible' check (visibility in ('internal', 'client_visible')),
  created_at timestamptz not null default now()
);

create index task_version_comments_version_idx on task_version_comments (version_id);

alter table task_version_comments enable row level security;

-- Both admin and the client on this project can see this feedback thread.
create policy task_version_comments_select on task_version_comments
  for select using (
    exists (select 1 from tasks t where t.id = task_id and can_access_project(t.project_id))
  );

-- Both admin and the client on this project can post to it (that's the
-- whole point — it's how the client tells you what to change).
create policy task_version_comments_insert on task_version_comments
  for insert with check (
    author_id = auth.uid()
    and exists (select 1 from tasks t where t.id = task_id and can_access_project(t.project_id))
  );

-- Storage bucket for the images people attach to version feedback (e.g. a
-- screenshot with an arrow drawn on it showing what to change).
insert into storage.buckets (id, name, public)
values ('version-images', 'version-images', true)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

create policy version_images_read on storage.objects
  for select using (bucket_id = 'version-images');

create policy version_images_write on storage.objects
  for insert with check (bucket_id = 'version-images' and auth.role() = 'authenticated');
