// Uji skrip delete-school.mjs pada sekolah uji: tanpa --confirm tidak menghapus, dengan konfirmasi salah tidak
// menghapus, dengan konfirmasi benar semua data (akun, berkas, jawaban, audit) hilang dan sekolah lain utuh.
//   node --env-file=.env.local scripts/test-delete-school.mjs
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { admin, createAuthUser, syntheticStudentEmail, guardNotProduction, listStorage, removeStoragePrefix } from './lib/admin-client.mjs';
guardNotProduction();
const results = [];
const ok = (name, cond, detail = '') => {
  results.push(cond);
  console.log(`${cond ? 'LULUS' : 'GAGAL'}  ${name}${detail ? `  (${detail})` : ''}`);
};
const run = (...a) => execFileSync(process.execPath, ['--env-file=.env.local', 'scripts/delete-school.mjs', ...a], { encoding: 'utf8' });
const mk = async (name) => (await admin.from('schools').insert({ name, is_test: true }).select().single()).data;
const target = await mk(`UJI HAPUS ${Date.now()}`);
const other = await mk(`UJI TETAP ${Date.now()}`);
const keepUsers = [];
try {
  const seed = async (school) => {
    const { data: klass } = await admin.from('classes').insert({ school_id: school.id, name: 'K' }).select().single();
    const { data: g } = await admin.from('groups').insert({ class_id: klass.id, name: 'G' }).select().single();
    const u = await createAuthUser(syntheticStudentEmail());
    await admin.from('students').insert({ id: u.id, school_id: school.id, class_id: klass.id, group_id: g.id, nis: `H${Date.now().toString(36).toUpperCase().slice(-6)}`, student_name: 'Siswa Hapus' });
    await admin.from('student_state').insert({ student_id: u.id, data: { initialHypothesis: 'x' } });
    const t = await createAuthUser(`uji-hapus-${randomUUID().slice(0, 8)}@emodul.test`);
    await admin.from('profiles').insert({ user_id: t.id, role: 'teacher', status: 'active', school_id: school.id, email: 'x@emodul.test' });
    await admin.storage.from('emodul-uploads').upload(`${school.id}/${klass.id}/${g.id}/process_photo-${randomUUID()}.jpg`, new Blob(['x'], { type: 'image/jpeg' }), { contentType: 'image/jpeg' });
    await admin.from('auth_events').insert({ school_id: school.id, student_id: u.id, nis: 'HAPUS', event: 'login_ok' });
    return { student: u.id, teacher: t.id };
  };
  const a = await seed(target);
  const b = await seed(other);
  keepUsers.push(b.student, b.teacher);

  let out = run(target.school_code);
  ok('Tanpa --confirm: hanya rencana, tidak ada yang dihapus', /1 akun siswa, 1 akun guru, 1 berkas/.test(out) && /Belum ada yang dihapus/.test(out) &&
    Boolean((await admin.from('schools').select('id').eq('id', target.id).maybeSingle()).data));
  out = run(target.school_code, '--confirm', other.school_code);
  ok('Konfirmasi dengan kode sekolah lain: tidak ada yang dihapus', /Belum ada yang dihapus/.test(out) && Boolean((await admin.from('schools').select('id').eq('id', target.id).maybeSingle()).data));
  out = run(target.school_code, '--confirm', target.school_code);
  ok('Konfirmasi benar: penghapusan berjalan', /Selesai: 1 berkas, 2 akun/.test(out), out.trim());
  ok('Sekolah, siswa, dan jawaban hilang', !(await admin.from('schools').select('id').eq('id', target.id).maybeSingle()).data &&
    !(await admin.from('student_state').select('student_id').eq('student_id', a.student).maybeSingle()).data);
  ok('Akun Auth siswa dan guru hilang', (await admin.auth.admin.getUserById(a.student)).error !== null && (await admin.auth.admin.getUserById(a.teacher)).error !== null);
  ok('Berkas Storage sekolah hilang', (await listStorage(target.id)).length === 0);
  const { count: ev } = await admin.from('auth_events').select('id', { count: 'exact', head: true }).eq('student_id', a.student);
  const { count: evNull } = await admin.from('auth_events').select('id', { count: 'exact', head: true }).eq('nis', 'HAPUS').is('school_id', null);
  ok('Catatan audit sekolah itu ikut terhapus', (ev ?? 0) === 0 && (evNull ?? 0) === 0);
  ok('Sekolah lain tetap utuh (siswa, guru, berkas, audit)',
    Boolean((await admin.from('student_state').select('student_id').eq('student_id', b.student).maybeSingle()).data) &&
    (await admin.auth.admin.getUserById(b.teacher)).error === null && (await listStorage(other.id)).length === 1 &&
    ((await admin.from('auth_events').select('id', { count: 'exact', head: true }).eq('school_id', other.id)).count ?? 0) === 1);
} finally {
  for (const s of [target, other]) await removeStoragePrefix(s.id).catch(() => {});
  for (const id of keepUsers) await admin.auth.admin.deleteUser(id).catch(() => {});
  await admin.from('auth_events').delete().eq('nis', 'HAPUS');
  await admin.from('schools').delete().in('id', [target.id, other.id]);
}
const passed = results.filter(Boolean).length;
console.log(`Hasil: ${passed}/${results.length} lulus. Data uji dihapus.`);
process.exit(passed === results.length ? 0 : 1);
