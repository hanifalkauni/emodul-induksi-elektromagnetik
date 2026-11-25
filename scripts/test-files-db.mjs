// Uji Fase 4 di database + Storage: unggah ke folder kelompok sendiri, path tidak bisa dipalsukan, batas ukuran
// dan jenis berkas, akses baca hanya kelompok + guru sekolah itu, tidak bisa menimpa, hapus oleh anggota.
// Membuat lalu menghapus data uji (termasuk berkas Storage).
//   node --env-file=.env.local scripts/test-files-db.mjs
import { randomUUID } from 'node:crypto';
import {
  admin, realtimeUserClient, createAuthUser, issueSession, syntheticStudentEmail, guardNotProduction, removeStoragePrefix,
} from './lib/admin-client.mjs';
guardNotProduction();
const BUCKET = 'emodul-uploads';
const RUN = Date.now().toString(36).toUpperCase().slice(-6);
const results = [];
const created = { users: [], schools: [] };
const ok = (name, cond, detail = '') => {
  results.push(cond);
  console.log(`${cond ? 'LULUS' : 'GAGAL'}  ${name}${detail ? `  (${detail})` : ''}`);
};
const jpeg = (n = 2048) => new Blob([new Uint8Array(n).fill(7)], { type: 'image/jpeg' });

async function student(schoolId, classId, groupId, nis) {
  const email = syntheticStudentEmail();
  const user = await createAuthUser(email);
  created.users.push(user.id);
  const { error } = await admin.from('students').insert({ id: user.id, school_id: schoolId, class_id: classId, group_id: groupId, nis, student_name: nis });
  if (error) throw error;
  const s = await issueSession(email);
  return { id: user.id, client: realtimeUserClient(s.access_token) };
}
async function teacher(schoolId) {
  const email = `guru-${RUN.toLowerCase()}-${randomUUID().slice(0, 6)}@emodul.test`;
  const user = await createAuthUser(email);
  created.users.push(user.id);
  const { error } = await admin.from('profiles').insert({ user_id: user.id, role: 'teacher', status: 'active', school_id: schoolId, email });
  if (error) throw error;
  const s = await issueSession(email);
  return { id: user.id, client: realtimeUserClient(s.access_token) };
}

async function run() {
  const mk = async (name) => {
    const { data: school, error } = await admin.from('schools').insert({ name: `${name} ${RUN}`, is_test: true }).select().single();
    if (error) throw error;
    created.schools.push(school.id);
    return school;
  };
  const school = await mk('UJI FILES');
  const other = await mk('UJI FILES LAIN');
  const { data: klass } = await admin.from('classes').insert({ school_id: school.id, name: 'K' }).select().single();
  const { data: klass2 } = await admin.from('classes').insert({ school_id: school.id, name: 'K2' }).select().single();
  const { data: g1 } = await admin.from('groups').insert({ class_id: klass.id, name: 'G1' }).select().single();
  const { data: g2 } = await admin.from('groups').insert({ class_id: klass.id, name: 'G2' }).select().single();
  const A = await student(school.id, klass.id, g1.id, `A${RUN}`);
  const B = await student(school.id, klass.id, g1.id, `B${RUN}`);
  const C = await student(school.id, klass.id, g2.id, `C${RUN}`);
  const T = await teacher(school.id);
  const T2 = await teacher(other.id);
  const dir = `${school.id}/${klass.id}/${g1.id}`;
  const path = `${dir}/process_photo-${randomUUID()}.jpg`;

  let r = await A.client.storage.from(BUCKET).upload(path, jpeg(), { contentType: 'image/jpeg' });
  ok('Anggota mengunggah foto ke folder kelompoknya', !r.error, r.error?.message ?? '');
  r = await A.client.from('files').insert({ group_id: g1.id, kind: 'process_photo', storage_path: path, file_name: 'a.jpg', size_bytes: 2048, uploaded_by: A.id });
  ok('Metadata berkas tercatat di files', !r.error, r.error?.message ?? '');

  r = await B.client.storage.from(BUCKET).createSignedUrl(path, 60);
  ok('Teman sekelompok mendapat signed URL', Boolean(r.data?.signedUrl), r.error?.message ?? '');
  if (r.data?.signedUrl) {
    const res = await fetch(r.data.signedUrl);
    const buf = await res.arrayBuffer();
    ok('Signed URL bisa diunduh dan isinya utuh', res.ok && buf.byteLength === 2048, `${res.status}, ${buf.byteLength} B`);
  }
  r = await T.client.storage.from(BUCKET).createSignedUrl(path, 60);
  ok('Guru sekolah itu bisa membuka foto', Boolean(r.data?.signedUrl), r.error?.message ?? '');
  r = await T2.client.storage.from(BUCKET).createSignedUrl(path, 60);
  ok('Guru sekolah lain TIDAK bisa membuka foto', !r.data?.signedUrl);
  r = await C.client.storage.from(BUCKET).createSignedUrl(path, 60);
  ok('Siswa kelompok lain TIDAK bisa membuat signed URL', !r.data?.signedUrl);
  r = await C.client.storage.from(BUCKET).download(path);
  ok('Siswa kelompok lain TIDAK bisa mengunduh', Boolean(r.error));
  r = await C.client.from('files').select('id').eq('group_id', g1.id);
  ok('Siswa kelompok lain tidak melihat metadata berkas', !r.error && r.data.length === 0);

  r = await C.client.storage.from(BUCKET).upload(`${dir}/process_photo-${randomUUID()}.jpg`, jpeg(), { contentType: 'image/jpeg' });
  ok('Siswa kelompok lain tidak bisa mengunggah ke folder kelompok ini', Boolean(r.error));
  r = await A.client.storage.from(BUCKET).upload(`${other.id}/${klass.id}/${g1.id}/process_photo-${randomUUID()}.jpg`, jpeg(), { contentType: 'image/jpeg' });
  ok('Segmen sekolah di path tidak bisa dipalsukan', Boolean(r.error));
  r = await A.client.storage.from(BUCKET).upload(`${school.id}/${klass2.id}/${g1.id}/process_photo-${randomUUID()}.jpg`, jpeg(), { contentType: 'image/jpeg' });
  ok('Segmen kelas di path tidak bisa dipalsukan', Boolean(r.error));
  r = await A.client.storage.from(BUCKET).upload(path, jpeg(1024), { contentType: 'image/jpeg', upsert: true });
  ok('Berkas yang ada tidak bisa ditimpa', Boolean(r.error));
  r = await A.client.storage.from(BUCKET).upload(`${dir}/process_photo-${randomUUID()}.jpg`, new Blob([new Uint8Array(2 * 1024 * 1024 + 10)], { type: 'image/jpeg' }), { contentType: 'image/jpeg' });
  ok('Berkas lebih dari 2 MB ditolak', Boolean(r.error), r.error?.message ?? 'diterima');
  r = await A.client.storage.from(BUCKET).upload(`${dir}/lab_report-${randomUUID()}.html`, new Blob(['<script>x</script>'], { type: 'text/html' }), { contentType: 'text/html' });
  ok('Jenis berkas yang tidak diizinkan ditolak', Boolean(r.error), r.error?.message ?? 'diterima');
  const pdfPath = `${dir}/lab_report-${randomUUID()}.pdf`;
  r = await A.client.storage.from(BUCKET).upload(pdfPath, new Blob(['%PDF-1.4 uji'], { type: 'application/pdf' }), { contentType: 'application/pdf' });
  ok('Laporan PDF bisa diunggah', !r.error, r.error?.message ?? '');

  r = await A.client.from('files').insert({ group_id: g1.id, kind: 'process_photo', storage_path: `${school.id}/${klass.id}/${g2.id}/process_photo-${randomUUID()}.jpg`, file_name: 'x', uploaded_by: A.id });
  ok('Metadata dengan path folder kelompok lain ditolak (migrasi 0010)', Boolean(r.error));
  r = await A.client.from('files').insert({ group_id: g1.id, kind: 'process_photo', storage_path: `${dir}/design_sketch-${randomUUID()}.jpg`, file_name: 'x', uploaded_by: A.id });
  ok('Metadata dengan nama berkas tidak sesuai jenis ditolak', Boolean(r.error));
  r = await A.client.from('files').insert({ group_id: g1.id, kind: 'process_photo', storage_path: `${dir}/process_photo-${randomUUID()}.jpg`, file_name: 'x', uploaded_by: B.id });
  ok('Metadata atas nama siswa lain ditolak', Boolean(r.error));

  r = await A.client.rpc('patch_group_state', { p_group: g1.id, p_patch: { processPhotoFile: { path, name: 'a.jpg', size: 2048, uploadedAt: new Date().toISOString() } } });
  const { data: gs } = await admin.from('group_state').select('data').eq('group_id', g1.id).single();
  const size = JSON.stringify(gs?.data ?? {}).length;
  ok('Referensi foto di group_state kecil (bukan base64)', !r.error && gs?.data?.processPhotoFile?.path === path && size < 2000, `${size} B`);

  r = await C.client.storage.from(BUCKET).remove([path]);
  const still = await admin.storage.from(BUCKET).list(dir, { search: path.split('/').pop() });
  ok('Siswa kelompok lain tidak bisa menghapus foto', (still.data ?? []).length === 1);
  r = await B.client.storage.from(BUCKET).remove([path]);
  const after = await admin.storage.from(BUCKET).list(dir, { search: path.split('/').pop() });
  ok('Anggota kelompok bisa menghapus foto', !r.error && (after.data ?? []).length === 0, r.error?.message ?? '');
  r = await B.client.from('files').delete().eq('storage_path', path).select();
  ok('Anggota kelompok bisa menghapus metadata', !r.error && r.data?.length === 1);
}

async function cleanup() {
  for (const id of created.schools) await removeStoragePrefix(id).catch((e) => console.error('Hapus berkas gagal:', e.message));
  for (const id of created.users) await admin.auth.admin.deleteUser(id);
  if (created.schools.length) await admin.from('schools').delete().in('id', created.schools);
}
let fatal = null;
try {
  await run();
} catch (e) {
  fatal = e;
  console.error('BERHENTI:', e.message);
} finally {
  await cleanup();
}
const passed = results.filter(Boolean).length;
console.log(`Hasil: ${passed}/${results.length} lulus. Data uji dihapus.`);
process.exit(fatal || passed !== results.length ? 1 : 0);
