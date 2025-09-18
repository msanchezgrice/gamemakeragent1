create extension if not exists "uuid-ossp";

create type orchestrator_run_status as enum ('queued','running','awaiting_human','paused','failed','done');
create type orchestrator_run_phase as enum (
  'intake','market','synthesis','deconstruct','prioritize','build','qa','deploy','measure','decision'
);
create type orchestrator_task_type as enum ('portfolio_approval','qa_verification','deployment_upload');
create type orchestrator_task_status as enum ('open','completed','cancelled');

create table orchestrator_runs (
  id uuid primary key default gen_random_uuid(),
  status orchestrator_run_status not null default 'queued',
  phase orchestrator_run_phase not null default 'market',
  brief jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  notes text
);

create table orchestrator_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references orchestrator_runs(id) on delete cascade,
  phase orchestrator_run_phase not null,
  status orchestrator_run_status not null default 'queued',
  started_at timestamptz,
  finished_at timestamptz,
  input jsonb,
  output jsonb,
  cost jsonb,
  error jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, phase)
);

create table orchestrator_artifacts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references orchestrator_runs(id) on delete cascade,
  step_id uuid references orchestrator_steps(id) on delete set null,
  phase orchestrator_run_phase not null,
  kind text not null,
  path text not null,
  sha256 text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table orchestrator_manual_tasks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references orchestrator_runs(id) on delete cascade,
  phase orchestrator_run_phase not null,
  task_type orchestrator_task_type not null,
  status orchestrator_task_status not null default 'open',
  title text not null,
  description text not null,
  created_at timestamptz not null default now(),
  due_at timestamptz,
  completed_at timestamptz,
  assignee text
);

create table orchestrator_notifications (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references orchestrator_runs(id) on delete cascade,
  task_id uuid references orchestrator_manual_tasks(id) on delete set null,
  message text not null,
  level text not null default 'info',
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table orchestrator_ls_scores (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references orchestrator_runs(id) on delete cascade,
  game_id uuid not null,
  variant_id uuid not null,
  score_class text not null,
  score numeric(5,4) not null,
  window_start timestamptz,
  window_end timestamptz,
  metrics jsonb not null,
  created_at timestamptz not null default now()
);

create table orchestrator_experiments (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references orchestrator_runs(id) on delete cascade,
  game_slug text not null,
  variant_id uuid not null,
  policy text not null,
  config jsonb not null,
  created_at timestamptz not null default now(),
  status text not null default 'draft'
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_orchestrator_runs_updated
before update on orchestrator_runs
for each row
execute procedure set_updated_at();

create trigger trg_orchestrator_steps_updated
before update on orchestrator_steps
for each row
execute procedure set_updated_at();

alter table orchestrator_runs enable row level security;
alter table orchestrator_steps enable row level security;
alter table orchestrator_artifacts enable row level security;
alter table orchestrator_manual_tasks enable row level security;
alter table orchestrator_notifications enable row level security;
alter table orchestrator_ls_scores enable row level security;
alter table orchestrator_experiments enable row level security;

create policy "service role full access" on orchestrator_runs
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "console read runs" on orchestrator_runs
  for select using (auth.role() in ('service_role','authenticated'));

create policy "service role full access" on orchestrator_steps
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "console read steps" on orchestrator_steps
  for select using (auth.role() in ('service_role','authenticated'));

create policy "service role full access" on orchestrator_artifacts
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "console read artifacts" on orchestrator_artifacts
  for select using (auth.role() in ('service_role','authenticated'));

create policy "service role full access" on orchestrator_manual_tasks
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "console read tasks" on orchestrator_manual_tasks
  for select using (auth.role() in ('service_role','authenticated'));

create policy "service role full access" on orchestrator_notifications
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "console read notifications" on orchestrator_notifications
  for select using (auth.role() in ('service_role','authenticated'));

create policy "service role full access" on orchestrator_ls_scores
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "console read ls scores" on orchestrator_ls_scores
  for select using (auth.role() in ('service_role','authenticated'));

create policy "service role full access" on orchestrator_experiments
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "console read experiments" on orchestrator_experiments
  for select using (auth.role() in ('service_role','authenticated'));
