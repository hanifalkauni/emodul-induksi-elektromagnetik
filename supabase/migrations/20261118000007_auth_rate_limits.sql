-- 0007: pembatas laju (rate limit) bersama dan pencatatan percobaan login yang atomik (Fase 1)
-- Fungsi serverless tidak berbagi memori, jadi hitungan disimpan di database.
-- Kunci memakai hash HMAC (IP tidak disimpan mentah). Hanya service_role yang bisa mengakses.

create table public.rate_limits (
  key           text primary key check (char_length(key) <= 200),
  window_start  timestamptz not null default now(),
  count         int not null default 0
);
create index rate_limits_window_idx on public.rate_limits (window_start);

alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from public, anon, authenticated;
grant all on public.rate_limits to service_role;

-- Jendela tetap: true bila masih di bawah batas, false bila sudah melewati.
create or replace function public.rate_limit_hit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  insert into public.rate_limits as r (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set count = case
                  when r.window_start < now() - make_interval(secs => p_window_seconds) then 1
                  else r.count + 1
                end,
        window_start = case
                  when r.window_start < now() - make_interval(secs => p_window_seconds) then now()
                  else r.window_start
                end
  returning count into v_count;
  return v_count <= p_max;
end;
$$;

-- Catat PIN salah. Pada percobaan ke-p_max: kunci akun p_lock_minutes menit dan nol-kan hitungan
-- (sehingga setelah kunci habis, siswa mendapat p_max percobaan lagi). Spec D6.
create or replace function public.record_login_failure(p_student uuid, p_max int default 5, p_lock_minutes int default 15)
returns table (failed_attempts int, locked_until timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_failed int;
  v_locked timestamptz;
begin
  update public.student_secrets s
     set failed_attempts = s.failed_attempts + 1, updated_at = now()
   where s.student_id = p_student
  returning s.failed_attempts into v_failed;

  if v_failed is null then
    return;
  end if;

  if v_failed >= p_max then
    v_locked := now() + make_interval(mins => p_lock_minutes);
    update public.students st set locked_until = v_locked where st.id = p_student;
    update public.student_secrets s set failed_attempts = 0 where s.student_id = p_student;
  end if;

  return query select v_failed, v_locked;
end;
$$;

create or replace function public.record_login_success(p_student uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.student_secrets set failed_attempts = 0, updated_at = now() where student_id = p_student;
  update public.students set locked_until = null, last_login_at = now() where id = p_student;
$$;

-- Supabase memberi EXECUTE ke anon/authenticated secara default pada fungsi baru di public: cabut.
revoke all on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;
revoke all on function public.record_login_failure(uuid, int, int) from public, anon, authenticated;
revoke all on function public.record_login_success(uuid) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, int, int) to service_role;
grant execute on function public.record_login_failure(uuid, int, int) to service_role;
grant execute on function public.record_login_success(uuid) to service_role;
