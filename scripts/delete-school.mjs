// Hapus SATU sekolah beserta seluruh datanya (permintaan penghapusan data / UU PDP, atau sekolah berhenti).
// Urutan: berkas Storage -> akun Auth siswa dan guru -> baris sekolah (kelas, kelompok, siswa, jawaban,
// kode aktivasi ikut terhapus lewat ON DELETE CASCADE). Akun admin tidak disentuh. TIDAK BISA DIBATALKAN;
// buat backup dulu bila ragu (docs/RUNBOOK.md).
//
//   node --env-file=.env.local scripts/delete-school.mjs <KODE_SEKOLAH>                  # hanya menampilkan rencana
//   node --env-file=.env.local scripts/delete-school.mjs <KODE_SEKOLAH> --confirm <KODE_SEKOLAH>
import { admin, listStorage, removeStoragePrefix } from './lib/admin-client.mjs';

const [code, flag, confirm] = process.argv.slice(2);
if (!code || !/^[A-HJ-NP-Z2-9]{6}$/.test(code.toUpperCase())) {
  console.error('Pakai: node --env-file=.env.local scripts/delete-school.mjs <KODE_SEKOLAH> [--confirm <KODE_SEKOLAH>]');
  process.exit(1);
}
const schoolCode = code.toUpperCase();
const { data: school, error } = await admin.from('schools').select('id, name, school_code, is_test').eq('school_code', schoolCode).maybeSingle();
if (error) throw error;
if (!school) {
  console.error(`Sekolah dengan Kode Sekolah ${schoolCode} tidak ditemukan.`);
  process.exit(1);
}
const [{ data: students }, { data: teachers }, files] = await Promise.all([
  admin.from('students').select('id').eq('school_id', school.id),
  admin.from('profiles').select('user_id, role').eq('school_id', school.id),
  listStorage(school.id),
]);
const teacherIds = (teachers ?? []).filter((t) => t.role === 'teacher').map((t) => t.user_id);
console.log(`Sekolah : ${school.name} (${school.school_code})${school.is_test ? ' [UJI]' : ''}`);
console.log(`Akan dihapus: ${students?.length ?? 0} akun siswa, ${teacherIds.length} akun guru, ${files.length} berkas Storage, semua kelas/kelompok/jawaban.`);
if (flag !== '--confirm' || (confirm ?? '').toUpperCase() !== schoolCode) {
  console.log(`\nBelum ada yang dihapus. Untuk benar-benar menghapus, jalankan dengan: --confirm ${schoolCode}`);
  process.exit(0);
}
const removed = await removeStoragePrefix(school.id);
let users = 0;
for (const id of [...(students ?? []).map((s) => s.id), ...teacherIds]) {
  const { error: dErr } = await admin.auth.admin.deleteUser(id);
  if (dErr && !/not found/i.test(dErr.message)) throw dErr;
  users++;
}
// Log audit sekolah ini (NIS, nama di detail) ikut dihapus agar tidak tersisa data pribadi. Harus SEBELUM
// baris sekolah dihapus, karena auth_events.school_id bernilai NULL setelahnya (on delete set null).
const { count, error: evErr } = await admin.from('auth_events').delete({ count: 'exact' }).eq('school_id', school.id);
if (evErr) throw evErr;
const { error: delErr } = await admin.from('schools').delete().eq('id', school.id);
if (delErr) throw delErr;
console.log(`Selesai: ${removed} berkas, ${users} akun, sekolah, dan ${count ?? 0} catatan audit dihapus.`);
