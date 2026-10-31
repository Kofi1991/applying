-- ZapApply v1 schema. Run in Supabase → SQL Editor (or `supabase db push`).

-- One profile per user: CV and job preferences.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  phone text,
  linkedin_url text,
  cv_path text,                       -- path in the private "cvs" storage bucket
  cv_text text,                       -- plain text extracted from the CV by the daily run
  job_titles text[] not null default '{}',
  locations text[] not null default '{London}',
  include_uk_remote boolean not null default true,
  max_office_days int not null default 2 check (max_office_days between 0 and 5),
  job_types text[] not null default '{permanent,contract}',
  salary_expectation int,             -- GBP per year, permanent roles
  day_rate_expectation int,           -- GBP per day, contract roles
  notice_period text,
  right_to_work text,
  run_hour int not null default 8 check (run_hour between 0 and 23), -- UK time
  weekdays_only boolean not null default true,
  active boolean not null default true,
  last_run_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Every role ever found for a user. The unique key stops repeats.
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  url text not null,
  title text not null,
  company text not null,
  office_days text,                   -- "0", "1", "2" or "Not stated"
  job_type text,
  pay text,
  summary text,
  fit_score int,
  fit_label text,                     -- "Very suitable" | "Good match"
  fit_reason text,
  gaps text,
  status text not null default 'new' check (status in ('new','approved','applied','needs_user','skipped')),
  found_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (profile_id, url)
);

-- One row per daily run, for troubleshooting.
create table public.runs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  roles_found int default 0,
  roles_kept int default 0,
  error text
);

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.runs enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own roles: read" on public.roles
  for select using (auth.uid() = profile_id);
create policy "own roles: update status" on public.roles
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "own runs: read" on public.runs
  for select using (auth.uid() = profile_id);

-- Private CV bucket: each user can only touch files under their own user-id folder.
insert into storage.buckets (id, name, public) values ('cvs', 'cvs', false)
  on conflict (id) do nothing;

create policy "own cv files" on storage.objects
  for all using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
