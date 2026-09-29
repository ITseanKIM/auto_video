create extension if not exists pgcrypto;

create type public.project_status as enum (
  'draft', 'outlining', 'scripting', 'voicing', 'illustrating',
  'composing', 'completed', 'failed', 'cancelled'
);

create type public.job_status as enum (
  'queued', 'running', 'succeeded', 'failed', 'cancelled'
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null,
  title text,
  language text not null default 'ko',
  target_duration_sec integer not null default 480 check (target_duration_sec between 30 and 7200),
  visual_style text,
  status public.project_status not null default 'draft',
  current_stage text,
  error_message text,
  settings jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.scenes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  scene_index integer not null,
  title text not null,
  summary text not null default '',
  setting_description text not null default '',
  image_prompt text,
  duration_sec numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, scene_index)
);

create table public.script_lines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  scene_id uuid not null references public.scenes(id) on delete cascade,
  line_index integer not null,
  speaker text not null default '나레이터',
  text text not null,
  emotion text not null default 'neutral',
  start_sec numeric,
  end_sec numeric,
  voice_asset_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, line_index)
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  scene_id uuid references public.scenes(id) on delete cascade,
  kind text not null check (kind in ('image','audio','video','subtitle','thumbnail','overlay','voice_reference')),
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint,
  duration_sec numeric,
  width integer,
  height integer,
  provider text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.script_lines
  add constraint script_lines_voice_asset_fk
  foreign key (voice_asset_id) references public.assets(id) on delete set null;

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  stage text not null,
  status public.job_status not null default 'queued',
  progress integer not null default 0 check (progress between 0 and 100),
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  idempotency_key text not null unique,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  provider text not null,
  model text,
  operation text not null,
  input_units bigint not null default 0,
  output_units bigint not null default 0,
  estimated_cost_usd numeric(12,6) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_user_created_idx on public.projects(user_id, created_at desc);
create index scenes_project_idx on public.scenes(project_id, scene_index);
create index script_lines_project_idx on public.script_lines(project_id, line_index);
create index assets_project_idx on public.assets(project_id, kind);
create index jobs_project_created_idx on public.jobs(project_id, created_at desc);

alter table public.projects enable row level security;
alter table public.scenes enable row level security;
alter table public.script_lines enable row level security;
alter table public.assets enable row level security;
alter table public.jobs enable row level security;
alter table public.usage_events enable row level security;

create policy "users own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users own scenes" on public.scenes
  for all using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "users own script lines" on public.script_lines
  for all using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "users own assets" on public.assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users own jobs" on public.jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users own usage" on public.usage_events
  for select using (auth.uid() = user_id);

