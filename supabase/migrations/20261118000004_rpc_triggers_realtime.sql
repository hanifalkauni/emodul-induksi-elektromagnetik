-- 0004: trigger, RPC, dan Realtime

-- updated_at otomatis
create trigger student_state_updated_at before update on public.student_state
  for each row execute function private.set_updated_at();
create trigger group_state_updated_at before update on public.group_state
  for each row execute function private.set_updated_at();
create trigger group_roles_updated_at before update on public.group_roles
  for each row execute function private.set_updated_at();
create trigger test_trials_updated_at before update on public.test_trials
  for each row execute function private.set_updated_at();

-- Setiap kelompok baru otomatis punya baris group_state
create or replace function private.create_group_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.group_state (group_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger groups_create_state after insert on public.groups
  for each row execute function private.create_group_state();

-- RPC: gabung patch ke group_state per kunci dan catat waktu server per kunci (spec 4.3).
-- security invoker: RLS tetap berlaku, sehingga hanya anggota kelompok yang bisa mengubah.
create or replace function public.patch_group_state(p_group uuid, p_patch jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_rows int;
begin
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    raise exception 'patch_must_be_object' using errcode = '22023';
  end if;
  if pg_column_size(p_patch) > 65536 then
    raise exception 'patch_too_large' using errcode = '54000';
  end if;

  update public.group_state gs
     set data = gs.data || p_patch,
         data_meta = gs.data_meta || coalesce(
           (select jsonb_object_agg(k, to_jsonb(now())) from jsonb_object_keys(p_patch) as k),
           '{}'::jsonb)
   where gs.group_id = p_group;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'group_not_found_or_forbidden' using errcode = '42501';
  end if;
end;
$$;

-- RPC ringan untuk Vercel Cron (anti-pause). Hanya service_role.
create or replace function public.ping()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select now();
$$;

-- Realtime (mengikuti RLS): papan ide, vote, dan data bersama kelompok
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.ideas, public.idea_votes, public.group_state;
  end if;
exception when duplicate_object then
  null;
end;
$$;
