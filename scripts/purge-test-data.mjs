// Hapus SEMUA data milik sekolah uji (is_test = true): berkas Storage, user Auth siswa/guru, lalu sekolahnya
// (kelas, kelompok, siswa, data e-modul ikut terhapus lewat ON DELETE CASCADE).
// Spec 10.1 (D24). Akun admin tidak pernah tersentuh.
//
//   node --env-file=.env.local scripts/purge-test-data.mjs

import { admin, guardNotProduction } from './lib/admin-client.mjs';

guardNotProduction();

const BUCKET = 'emodul-uploads';

async function listAll(prefix) {
  const out = [];
  const { data, error } = await admin.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw error;
  for (const item of data ?? []) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) out.push(...(await listAll(path))); // folder
    else out.push(path);
  }
  return out;
}

async function main() {
  const { data: schools, error } = await admin.from('schools').select('id, name').eq('is_test', true);
  if (error) throw error;
  if (!schools.length) {
    console.log('Tidak ada sekolah uji.');
    return;
  }
  const schoolIds = schools.map((s) => s.id);

  // 1) Berkas Storage di folder sekolah uji
  let removedFiles = 0;
  for (const id of schoolIds) {
    const paths = await listAll(id);
    for (let i = 0; i < paths.length; i += 100) {
      const { error: rmErr } = await admin.storage.from(BUCKET).remove(paths.slice(i, i + 100));
      if (rmErr) throw rmErr;
    }
    removedFiles += paths.length;
  }

  // 2) User Auth milik siswa dan guru (bukan admin) di sekolah uji
  const { data: students, error: sErr } = await admin.from('students').select('id').in('school_id', schoolIds);
  if (sErr) throw sErr;
  const { data: teachers, error: tErr } = await admin
    .from('profiles').select('user_id').in('school_id', schoolIds).eq('role', 'teacher');
  if (tErr) throw tErr;

  const userIds = [...students.map((s) => s.id), ...teachers.map((t) => t.user_id)];
  for (const uid of userIds) {
    const { error: dErr } = await admin.auth.admin.deleteUser(uid);
    if (dErr && !/not found/i.test(dErr.message)) throw dErr;
  }

  // 3) Sekolah (kelas, kelompok, data e-modul ikut terhapus)
  const { error: delErr } = await admin.from('schools').delete().in('id', schoolIds);
  if (delErr) throw delErr;

  console.log(`Dihapus: ${schools.length} sekolah uji, ${userIds.length} akun, ${removedFiles} berkas.`);
}

main().catch((e) => {
  console.error('Pembersihan gagal:', e.message ?? e);
  process.exit(1);
});
