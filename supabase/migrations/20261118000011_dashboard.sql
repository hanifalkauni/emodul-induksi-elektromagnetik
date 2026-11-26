-- 0011 (Fase 5): view dashboard guru. security_invoker = on: RLS tabel asal tetap berlaku untuk pemanggil,
-- sehingga guru hanya melihat siswa/kelompok sekolahnya dan siswa hanya melihat dirinya/kelompoknya.

create or replace view public.v_class_progress
with (security_invoker = on) as
select
  s.id                                   as student_id,
  s.school_id,
  s.class_id,
  s.group_id,
  g.name                                 as group_name,
  s.nis,
  s.student_name,
  s.status,
  s.locked_until,
  s.must_change_pin,
  s.last_login_at,
  s.created_at,
  coalesce(st.completion_percent, 0)     as completion_percent,
  coalesce(st.current_screen, 1)         as current_screen,
  coalesce(cardinality(st.visited_screens), 0) as visited_count,
  st.updated_at                          as state_updated_at
from public.students s
left join public.groups g on g.id = s.group_id
left join public.student_state st on st.student_id = s.id;

-- Status foto/berkas dibaca dari referensi di group_state (sumber kebenaran Fase 4), bukan dari tabel files,
-- karena files bisa berisi berkas yatim yang sudah diganti.
create or replace view public.v_group_summary
with (security_invoker = on) as
select
  g.id                                   as group_id,
  g.class_id,
  g.name,
  (select count(*) from public.students s where s.group_id = g.id and s.status = 'active')::int as member_count,
  (select count(*) from public.ideas i where i.group_id = g.id)::int as idea_count,
  coalesce((
    select jsonb_agg(jsonb_build_object(
             'student_id', s.id,
             'name', s.student_name,
             'ideas', (select count(*) from public.ideas i where i.group_id = g.id and i.author_id = s.id))
           order by s.student_name)
      from public.students s
     where s.group_id = g.id and s.status = 'active'
  ), '[]'::jsonb)                        as ideas_per_member,
  (select count(*) from public.test_trials t where t.group_id = g.id)::int as trial_count,
  (select count(*) from public.test_trials t where t.group_id = g.id and btrim(t.voltage) <> '')::int as filled_trial_count,
  nullif(gs.data ->> 'designSuccessStatus', '') as design_status,
  nullif(gs.data ->> 'designName', '')          as design_name,
  coalesce(jsonb_typeof(gs.data -> 'designSketchFile') = 'object', false)  as has_design_sketch,
  coalesce(jsonb_typeof(gs.data -> 'processPhotoFile') = 'object', false)  as has_process_photo,
  coalesce(jsonb_typeof(gs.data -> 'prototypePhotoFile') = 'object', false) as has_prototype_photo,
  coalesce(jsonb_typeof(gs.data -> 'labReportFile') = 'object', false)     as has_lab_report,
  gs.updated_at                          as state_updated_at
from public.groups g
left join public.group_state gs on gs.group_id = g.id;

revoke all on public.v_class_progress, public.v_group_summary from anon, authenticated;
grant select on public.v_class_progress, public.v_group_summary to authenticated, service_role;

-- Indeks untuk hitungan per kelompok dan per penulis
create index if not exists ideas_author_idx on public.ideas (group_id, author_id);
create index if not exists students_class_created_idx on public.students (class_id, created_at);
