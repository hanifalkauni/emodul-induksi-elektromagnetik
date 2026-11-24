-- 0005: fungsi bantu RLS, RLS, GRANT eksplisit, dan policy
--
-- Prinsip:
--  * "Grant API access to new tables automatically" dimatikan di project, jadi SEMUA hak ditulis di sini.
--  * Klien (authenticated) hanya mendapat hak minimum, sering per kolom.
--  * Operasi akun (daftar/login/PIN/kunci/pindah/undangan guru) hanya lewat service_role (Vercel Functions).
--  * Fungsi bantu ada di schema `private` (tidak terekspos sebagai RPC).

-- ---------------------------------------------------------------------------
-- Fungsi bantu (security definer: membaca tabel tanpa terhalang RLS, aman dari rekursi policy)
-- ---------------------------------------------------------------------------

create or replace function private.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
     where user_id = (select auth.uid()) and role = 'admin' and status = 'active'
  );
$$;

create or replace function private.is_teacher_of_school(p_school uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select p_school is not null and exists (
    select 1 from public.profiles
     where user_id = (select auth.uid()) and role = 'teacher' and status = 'active' and school_id = p_school
  );
$$;

create or replace function private.is_staff_of_school(p_school uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.is_admin() or private.is_teacher_of_school(p_school);
$$;

create or replace function private.current_school_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select school_id from public.profiles where user_id = (select auth.uid()) and status = 'active'),
    (select school_id from public.students where id = (select auth.uid()) and status = 'active')
  );
$$;

create or replace function private.is_active_student()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.students where id = (select auth.uid()) and status = 'active');
$$;

create or replace function private.my_class_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select class_id from public.students where id = (select auth.uid()) and status = 'active';
$$;

create or replace function private.my_group_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select group_id from public.students where id = (select auth.uid()) and status = 'active';
$$;

create or replace function private.class_school_id(p_class uuid)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select school_id from public.classes where id = p_class;
$$;

create or replace function private.group_school_id(p_group uuid)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select c.school_id
    from public.groups g join public.classes c on c.id = g.class_id
   where g.id = p_group;
$$;

create or replace function private.student_school_id(p_student uuid)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select school_id from public.students where id = p_student;
$$;

create or replace function private.idea_group_id(p_idea uuid)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select group_id from public.ideas where id = p_idea;
$$;

create or replace function private.is_group_member(p_group uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select p_group is not null and exists (
    select 1 from public.students
     where id = (select auth.uid()) and group_id = p_group and status = 'active'
  );
$$;

create or replace function private.is_staff_of_group(p_group uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.is_staff_of_school(private.group_school_id(p_group));
$$;

create or replace function private.can_access_group(p_group uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.is_group_member(p_group) or private.is_staff_of_group(p_group);
$$;

create or replace function private.student_in_group(p_student uuid, p_group uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.students where id = p_student and group_id = p_group);
$$;

-- ---------------------------------------------------------------------------
-- RLS aktif di semua tabel
-- ---------------------------------------------------------------------------
alter table public.schools                    enable row level security;
alter table public.profiles                   enable row level security;
alter table public.classes                    enable row level security;
alter table public.groups                     enable row level security;
alter table public.students                   enable row level security;
alter table public.student_secrets            enable row level security;
alter table public.auth_events                enable row level security;
alter table public.teacher_invites            enable row level security;
alter table public.teacher_invite_redemptions enable row level security;
alter table public.student_state              enable row level security;
alter table public.group_state                enable row level security;
alter table public.group_roles                enable row level security;
alter table public.ideas                      enable row level security;
alter table public.idea_votes                 enable row level security;
alter table public.test_trials                enable row level security;
alter table public.files                      enable row level security;

-- ---------------------------------------------------------------------------
-- GRANT: mulai dari nol, lalu beri hak minimum
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- service_role boleh semua fungsi public
grant execute on all functions in schema public to service_role;
-- klien boleh memanggil RPC patch_group_state saja (ping khusus service_role)
grant execute on function public.patch_group_state(uuid, jsonb) to authenticated;

-- Fungsi bantu private dipanggil dari policy, jadi harus bisa dieksekusi oleh pemanggil
grant execute on all functions in schema private to authenticated, service_role;

-- Tabel yang hanya dibaca klien
grant select on public.schools, public.profiles, public.students, public.auth_events to authenticated;

-- profiles: pengguna hanya boleh mengubah nama tampilannya sendiri
grant update (display_name) on public.profiles to authenticated;

-- classes & groups: guru membuat/mengubah lewat RLS; kode kelas dibuat otomatis oleh default
grant select on public.classes to authenticated;
grant insert (school_id, teacher_id, name) on public.classes to authenticated;
grant update (name, archived) on public.classes to authenticated;

grant select on public.groups to authenticated;
grant insert (class_id, name) on public.groups to authenticated;
grant update (name) on public.groups to authenticated;

-- data individu
grant select on public.student_state to authenticated;
grant insert (student_id, current_screen, visited_screens, completion_percent, data) on public.student_state to authenticated;
grant update (current_screen, visited_screens, completion_percent, data) on public.student_state to authenticated;

-- data kelompok
grant select on public.group_state to authenticated;
grant update (data, data_meta) on public.group_state to authenticated;

grant select on public.group_roles to authenticated;
grant insert (group_id, role, member_name, task_description, member_id) on public.group_roles to authenticated;
grant update (member_name, task_description, member_id) on public.group_roles to authenticated;
grant delete on public.group_roles to authenticated;

grant select on public.ideas to authenticated;
grant insert (group_id, author_id, author_name, title, drive_mechanism, description, color) on public.ideas to authenticated;
grant update (title, drive_mechanism, description, color) on public.ideas to authenticated;
grant delete on public.ideas to authenticated;

grant select on public.idea_votes to authenticated;
grant insert (idea_id, voter_id) on public.idea_votes to authenticated;
grant delete on public.idea_votes to authenticated;

grant select on public.test_trials to authenticated;
grant insert (group_id, sort_order, trial_label, voltage, turns, speed, magnet_condition, led_lit) on public.test_trials to authenticated;
grant update (sort_order, trial_label, voltage, turns, speed, magnet_condition, led_lit) on public.test_trials to authenticated;
grant delete on public.test_trials to authenticated;

grant select on public.files to authenticated;
grant insert (group_id, kind, storage_path, file_name, size_bytes, uploaded_by) on public.files to authenticated;
grant delete on public.files to authenticated;

-- student_secrets, teacher_invites, teacher_invite_redemptions: TIDAK ada grant ke klien (hanya service_role).

-- ---------------------------------------------------------------------------
-- Policy
-- ---------------------------------------------------------------------------

-- schools
create policy schools_select on public.schools for select to authenticated
  using (private.is_admin() or id = private.current_school_id());

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (user_id = (select auth.uid()) or private.is_staff_of_school(school_id));
create policy profiles_update_self on public.profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- classes
create policy classes_select on public.classes for select to authenticated
  using (private.is_staff_of_school(school_id) or id = private.my_class_id());
create policy classes_insert on public.classes for insert to authenticated
  with check (private.is_teacher_of_school(school_id) and teacher_id = (select auth.uid()));
create policy classes_update on public.classes for update to authenticated
  using (private.is_teacher_of_school(school_id))
  with check (private.is_teacher_of_school(school_id));

-- groups
create policy groups_select on public.groups for select to authenticated
  using (private.is_staff_of_school(private.class_school_id(class_id)) or id = private.my_group_id());
create policy groups_insert on public.groups for insert to authenticated
  with check (private.is_teacher_of_school(private.class_school_id(class_id)));
create policy groups_update on public.groups for update to authenticated
  using (private.is_teacher_of_school(private.class_school_id(class_id)))
  with check (private.is_teacher_of_school(private.class_school_id(class_id)));

-- students (hanya baca; semua perubahan lewat service_role)
create policy students_select on public.students for select to authenticated
  using (id = (select auth.uid()) or private.is_staff_of_school(school_id));

-- auth_events (hanya baca oleh staf sekolah itu; admin melihat semua)
create policy auth_events_select on public.auth_events for select to authenticated
  using (private.is_staff_of_school(school_id));

-- student_state
create policy student_state_select on public.student_state for select to authenticated
  using (student_id = (select auth.uid()) or private.is_staff_of_school(private.student_school_id(student_id)));
create policy student_state_insert on public.student_state for insert to authenticated
  with check (student_id = (select auth.uid()) and private.is_active_student());
create policy student_state_update on public.student_state for update to authenticated
  using (student_id = (select auth.uid()) and private.is_active_student())
  with check (student_id = (select auth.uid()) and private.is_active_student());

-- group_state
create policy group_state_select on public.group_state for select to authenticated
  using (private.can_access_group(group_id));
create policy group_state_update on public.group_state for update to authenticated
  using (private.is_group_member(group_id))
  with check (private.is_group_member(group_id));

-- group_roles
create policy group_roles_select on public.group_roles for select to authenticated
  using (private.can_access_group(group_id));
create policy group_roles_insert on public.group_roles for insert to authenticated
  with check (private.is_group_member(group_id)
              and (member_id is null or private.student_in_group(member_id, group_id)));
create policy group_roles_update on public.group_roles for update to authenticated
  using (private.is_group_member(group_id))
  with check (private.is_group_member(group_id)
              and (member_id is null or private.student_in_group(member_id, group_id)));
create policy group_roles_delete on public.group_roles for delete to authenticated
  using (private.is_group_member(group_id));

-- ideas
create policy ideas_select on public.ideas for select to authenticated
  using (private.can_access_group(group_id));
create policy ideas_insert on public.ideas for insert to authenticated
  with check (private.is_group_member(group_id) and author_id = (select auth.uid()));
create policy ideas_update on public.ideas for update to authenticated
  using (author_id = (select auth.uid()) and private.is_group_member(group_id))
  with check (author_id = (select auth.uid()) and private.is_group_member(group_id));
create policy ideas_delete on public.ideas for delete to authenticated
  using ((author_id = (select auth.uid()) and private.is_group_member(group_id))
         or private.is_staff_of_group(group_id));

-- idea_votes
create policy idea_votes_select on public.idea_votes for select to authenticated
  using (private.can_access_group(private.idea_group_id(idea_id)));
create policy idea_votes_insert on public.idea_votes for insert to authenticated
  with check (voter_id = (select auth.uid()) and private.is_group_member(private.idea_group_id(idea_id)));
create policy idea_votes_delete on public.idea_votes for delete to authenticated
  using (voter_id = (select auth.uid()));

-- test_trials
create policy test_trials_select on public.test_trials for select to authenticated
  using (private.can_access_group(group_id));
create policy test_trials_insert on public.test_trials for insert to authenticated
  with check (private.is_group_member(group_id));
create policy test_trials_update on public.test_trials for update to authenticated
  using (private.is_group_member(group_id))
  with check (private.is_group_member(group_id));
create policy test_trials_delete on public.test_trials for delete to authenticated
  using (private.is_group_member(group_id));

-- files (metadata; isi berkas dilindungi policy Storage di migrasi berikutnya)
create policy files_select on public.files for select to authenticated
  using (private.can_access_group(group_id));
create policy files_insert on public.files for insert to authenticated
  with check (private.is_group_member(group_id) and uploaded_by = (select auth.uid()));
create policy files_delete on public.files for delete to authenticated
  using (private.is_group_member(group_id) or private.is_staff_of_group(group_id));

-- ---------------------------------------------------------------------------
-- View daftar anggota kelompok (tanpa NIS) untuk dropdown peran dan nama pengusul.
-- Berjalan dengan hak pemilik (melewati RLS) tetapi difilter ketat ke kelompok pemanggil.
-- ---------------------------------------------------------------------------
create view public.v_group_members as
  select s.id as student_id, s.group_id, s.student_name
    from public.students s
   where s.status = 'active'
     and s.group_id is not null
     and s.group_id = private.my_group_id();

revoke all on public.v_group_members from anon, authenticated;
grant select on public.v_group_members to authenticated;
grant select on public.v_group_members to service_role;
