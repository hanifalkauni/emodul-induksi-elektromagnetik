-- 0012 (Fase 6): catatan cron dan fungsi bantu pemeliharaan. Semuanya hanya untuk service_role
-- (dipanggil Vercel Function); klien tidak punya hak apa pun.

create table if not exists public.ops_runs (
  id           bigint generated always as identity primary key,
  job          text not null check (job in ('ping', 'maintenance')),
  ok           boolean not null,
  detail       jsonb not null default '{}'::jsonb,
  duration_ms  int not null default 0,
  ran_at       timestamptz not null default now()
);
create index if not exists ops_runs_job_idx on public.ops_runs (job, ran_at desc);
alter table public.ops_runs enable row level security;
revoke all on public.ops_runs from anon, authenticated;
grant select, insert, delete on public.ops_runs to service_role;

-- Pemakaian kuota Free (500 MB database, 1 GB Storage) untuk panel admin.
create or replace function public.ops_usage()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'db_bytes', pg_database_size(current_database()),
    'storage_bytes', coalesce((select sum((o.metadata ->> 'size')::bigint) from storage.objects o where o.bucket_id = 'emodul-uploads'), 0),
    'storage_objects', (select count(*) from storage.objects o where o.bucket_id = 'emodul-uploads'),
    'schools', (select count(*) from public.schools where not is_test),
    'students', (select count(*) from public.students s join public.schools sc on sc.id = s.school_id where not sc.is_test),
    'auth_events', (select count(*) from public.auth_events)
  );
$$;

-- Objek Storage tanpa baris metadata (unggah yang gagal dicatat), lebih tua dari p_min_age.
create or replace function public.ops_untracked_objects(p_min_age interval default interval '1 day', p_limit int default 500)
returns table (name text)
language sql
stable
security definer
set search_path = ''
as $$
  select o.name
    from storage.objects o
   where o.bucket_id = 'emodul-uploads'
     and o.created_at < now() - p_min_age
     and not exists (select 1 from public.files f where f.storage_path = o.name)
   order by o.created_at
   limit least(greatest(p_limit, 1), 1000);
$$;

revoke all on function public.ops_usage() from public, anon, authenticated;
revoke all on function public.ops_untracked_objects(interval, int) from public, anon, authenticated;
grant execute on function public.ops_usage() to service_role;
grant execute on function public.ops_untracked_objects(interval, int) to service_role;
