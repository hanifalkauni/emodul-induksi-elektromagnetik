-- 0010 (Fase 4): foto dan sketsa di Storage.
-- Metadata berkas (public.files) dan path Storage harus berada di folder kelompok itu sendiri:
--   {school_id}/{class_id}/{group_id}/{kind}-{uuid}.{ext}
-- Sebelumnya policy files_insert hanya memeriksa keanggotaan, sehingga siswa bisa mencatat path milik
-- kelompok lain. Policy unggah Storage juga belum memeriksa segmen kelas.

create or replace function private.group_class_id(p_group uuid)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select g.class_id from public.groups g where g.id = p_group;
$$;
revoke all on function private.group_class_id(uuid) from public;
grant execute on function private.group_class_id(uuid) to authenticated, service_role;

-- files: path harus di folder sekolah/kelas/kelompok yang sama dengan group_id, dan nama berkas diawali kind
drop policy if exists files_insert on public.files;
create policy files_insert on public.files for insert to authenticated
  with check (
    private.is_group_member(group_id)
    and uploaded_by = (select auth.uid())
    and split_part(storage_path, '/', 1) = private.group_school_id(group_id)::text
    and split_part(storage_path, '/', 2) = private.group_class_id(group_id)::text
    and split_part(storage_path, '/', 3) = group_id::text
    and split_part(storage_path, '/', 4) like kind || '-%'
    and split_part(storage_path, '/', 5) = ''
  );

-- Storage: segmen kelas juga harus cocok dengan kelas kelompok
drop policy if exists emodul_uploads_insert on storage.objects;
create policy emodul_uploads_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'emodul-uploads'
    and private.is_group_member(private.try_uuid((storage.foldername(name))[3]))
    and (storage.foldername(name))[1] =
        private.group_school_id(private.try_uuid((storage.foldername(name))[3]))::text
    and (storage.foldername(name))[2] =
        private.group_class_id(private.try_uuid((storage.foldername(name))[3]))::text
  );
