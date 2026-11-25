-- 0008: Fase 2 (guru dan admin)
--  * redeem_teacher_invite: penebusan kode aktivasi guru yang atomik (D18, D20, D22, D23)
--  * jenis peristiwa audit tambahan
--  * hook_before_user_created: fungsi untuk hook Auth "Before User Created" (belum aktif sampai
--    diaktifkan di dashboard Supabase > Authentication > Hooks)

-- ---------------------------------------------------------------------------
-- Jenis peristiwa audit tambahan
-- ---------------------------------------------------------------------------
alter table public.auth_events drop constraint if exists auth_events_event_check;
alter table public.auth_events add constraint auth_events_event_check check (event in (
  'register', 'login_ok', 'login_fail', 'locked', 'unlock', 'reset_pin', 'change_pin', 'disabled',
  'enabled', 'move', 'student_update', 'student_delete',
  'teacher_activate', 'teacher_disable', 'teacher_enable',
  'invite_create', 'invite_revoke', 'invite_extend',
  'school_create', 'school_update', 'school_merge', 'school_code_rotate', 'join_code_rotate'));

-- ---------------------------------------------------------------------------
-- Penebusan kode aktivasi guru.
-- Baris undangan dikunci (FOR UPDATE) agar dua guru yang menebus bersamaan tidak membuat
-- dua sekolah baru atau melewati max_uses.
-- Galat dikirim sebagai pesan berkode (mis. 'invite_expired') dan diterjemahkan di server.
-- ---------------------------------------------------------------------------
create or replace function public.redeem_teacher_invite(p_code_hash text, p_user uuid, p_email text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv public.teacher_invites%rowtype;
  prof public.profiles%rowtype;
  v_school uuid;
  v_created boolean := false;
  v_email text := lower(coalesce(p_email, ''));
begin
  select * into inv from public.teacher_invites where code_hash = p_code_hash for update;
  if not found then raise exception 'invite_not_found'; end if;
  if inv.revoked then raise exception 'invite_revoked'; end if;
  if inv.expires_at < now() then raise exception 'invite_expired'; end if;
  if inv.bound_email is not null and inv.bound_email <> v_email then raise exception 'invite_email_mismatch'; end if;
  if exists (select 1 from public.students where id = p_user) then raise exception 'is_student'; end if;

  select * into prof from public.profiles where user_id = p_user;
  if found then
    if prof.role = 'admin' then raise exception 'is_admin'; end if;
    if prof.status <> 'active' then raise exception 'teacher_disabled'; end if;
    if inv.school_id is not null and prof.school_id = inv.school_id then
      -- Sudah guru di sekolah ini: tidak menambah hitungan pemakaian
      return jsonb_build_object('school_id', prof.school_id, 'already', true, 'created_school', false);
    end if;
    raise exception 'other_school';
  end if;

  if inv.max_uses is not null and inv.use_count >= inv.max_uses then raise exception 'invite_exhausted'; end if;

  if inv.school_id is null then
    if inv.new_school_npsn is not null and exists (select 1 from public.schools where npsn = inv.new_school_npsn) then
      raise exception 'npsn_exists';
    end if;
    insert into public.schools (name, city, npsn, created_by)
    values (inv.new_school_name, inv.new_school_city, inv.new_school_npsn, p_user)
    returning id into v_school;
    update public.teacher_invites set school_id = v_school where id = inv.id;
    v_created := true;
  else
    v_school := inv.school_id;
    if not exists (select 1 from public.schools where id = v_school and status = 'active') then
      raise exception 'school_inactive';
    end if;
  end if;

  insert into public.profiles (user_id, role, status, school_id, email)
  values (p_user, 'teacher', 'active', v_school, v_email);

  update public.teacher_invites set use_count = use_count + 1 where id = inv.id;
  insert into public.teacher_invite_redemptions (invite_id, user_id, email) values (inv.id, p_user, v_email);

  return jsonb_build_object('school_id', v_school, 'already', false, 'created_school', v_created);
end;
$$;

revoke all on function public.redeem_teacher_invite(text, uuid, text) from public, anon, authenticated;
grant execute on function public.redeem_teacher_invite(text, uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- Hook Auth "Before User Created" (opsional; aktif hanya bila dipilih di dashboard).
-- Mengizinkan:
--   * akun Google (guru dan admin yang login dengan Google)
--   * user Auth internal siswa yang dibuat server kita (@siswa.emodul.invalid)
--   * akun uji skrip (@emodul.test)
-- Semua pendaftaran email lain ditolak. Akun yang lolos tetap tidak punya akses apa pun
-- tanpa baris students/profiles (RLS).
-- ---------------------------------------------------------------------------
create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_provider text := coalesce(event->'user'->'app_metadata'->>'provider', '');
  v_email text := lower(coalesce(event->'user'->>'email', ''));
begin
  if v_provider = 'google' then
    return '{}'::jsonb;
  end if;
  if v_provider = 'email' and (v_email like '%@siswa.emodul.invalid' or v_email like '%@emodul.test') then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object(
    'http_code', 403,
    'message', 'Pendaftaran akun hanya lewat aplikasi E-Modul (siswa) atau Google (guru).'));
end;
$$;

grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_before_user_created(jsonb) from public, anon, authenticated;
