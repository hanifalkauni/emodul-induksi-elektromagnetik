-- 0009: Fase 3 (kolaborasi kelompok)
--  * Klien boleh menentukan id baris baru (UUID acak) untuk ide dan baris uji, supaya baris yang dibuat
--    saat offline punya id tetap dan bisa dikirim ulang tanpa duplikat.
--  * Setiap kelompok otomatis punya 5 baris peran dan 1 baris uji (tidak ada balapan antar anggota).
--  * Realtime juga untuk group_roles dan test_trials.

grant insert (id) on public.ideas to authenticated;
grant insert (id) on public.test_trials to authenticated;

create or replace function private.create_group_defaults()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.group_roles (group_id, role, task_description) values
    (new.id, 'Leader', 'Mengatur pembagian tugas'),
    (new.id, 'Engineer', 'Menyiapkan alat'),
    (new.id, 'Data Analyst', 'Mencatat data'),
    (new.id, 'Experimenter', 'Melakukan percobaan'),
    (new.id, 'Communicator', 'Menyampaikan hasil')
  on conflict do nothing;
  insert into public.test_trials (group_id, sort_order, trial_label) values (new.id, 0, 'Uji Coba 1');
  return new;
end;
$$;

create trigger groups_create_defaults after insert on public.groups
  for each row execute function private.create_group_defaults();

-- Isi untuk kelompok yang sudah ada
insert into public.group_roles (group_id, role, task_description)
select g.id, r.role, r.task
  from public.groups g
 cross join (values
   ('Leader', 'Mengatur pembagian tugas'),
   ('Engineer', 'Menyiapkan alat'),
   ('Data Analyst', 'Mencatat data'),
   ('Experimenter', 'Melakukan percobaan'),
   ('Communicator', 'Menyampaikan hasil')) as r(role, task)
on conflict do nothing;

insert into public.test_trials (group_id, sort_order, trial_label)
select g.id, 0, 'Uji Coba 1'
  from public.groups g
 where not exists (select 1 from public.test_trials t where t.group_id = g.id);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.group_roles, public.test_trials;
  end if;
exception when duplicate_object then
  null;
end;
$$;
