-- 0006: bucket Storage privat + policy per kelompok
-- Path berkas: {school_id}/{class_id}/{group_id}/{kind}-{uuid}.{ext}
-- (storage.foldername(name))[1] = school, [2] = class, [3] = group

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'emodul-uploads', 'emodul-uploads', false, 2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- Baca: anggota kelompok, guru sekolah itu, admin
create policy emodul_uploads_select on storage.objects for select to authenticated
  using (
    bucket_id = 'emodul-uploads'
    and private.can_access_group(private.try_uuid((storage.foldername(name))[3]))
  );

-- Unggah: hanya anggota kelompok, dan segmen sekolah di path harus cocok dengan sekolah kelompok
create policy emodul_uploads_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'emodul-uploads'
    and private.is_group_member(private.try_uuid((storage.foldername(name))[3]))
    and (storage.foldername(name))[1] =
        private.group_school_id(private.try_uuid((storage.foldername(name))[3]))::text
  );

-- Hapus: anggota kelompok atau staf sekolah itu
create policy emodul_uploads_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'emodul-uploads'
    and (
      private.is_group_member(private.try_uuid((storage.foldername(name))[3]))
      or private.is_staff_of_group(private.try_uuid((storage.foldername(name))[3]))
    )
  );

-- Tidak ada policy UPDATE: berkas tidak dapat ditimpa, hanya diganti dengan unggah + hapus.
