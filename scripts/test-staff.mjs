// Uji Fase 2: endpoint guru dan admin, lewat handler api/index.js (sama dengan di Vercel).
// Membuat akun uji (@emodul.test), sekolah, dan kode aktivasi sementara, lalu menghapus semuanya.
//
//   node --env-file=.env.local scripts/test-staff.mjs

import { handle } from '../api/index.js';
import { admin, userClient, createAuthUser, issueSession, guardNotProduction } from './lib/admin-client.mjs';

guardNotProduction();
if (process.env.TURNSTILE_SECRET_KEY !== '1x0000000000000000000000000000000AA') {
  console.error('Uji ini butuh kunci uji Turnstile (TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA).');
  process.exit(1);
}

const RUN = Date.now().toString(36).toUpperCase().slice(-6);
const CAPTCHA = 'XXXX.DUMMY.TOKEN.XXXX';
const created = { users: [], schools: [], invites: [] };
const results = [];
let ipCounter = 1;

function record(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'LULUS' : 'GAGAL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function call(route, body, token, method = 'POST') {
  const headers = { 'x-forwarded-for': `192.0.2.${(ipCounter++ % 250) + 1}` };
  if (method === 'POST') headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await handle(new Request(`http://localhost/api?route=${route}`, {
    method, headers, body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
  }));
  return { status: res.status, body: await res.json() };
}
const get = (route, token) => call(route, null, token, 'GET');

async function staffUser(label, role = null, schoolId = null) {
  const email = `uji-${label}-${RUN}@emodul.test`.toLowerCase();
  const user = await createAuthUser(email);
  created.users.push(user.id);
  if (role) {
    const { error } = await admin.from('profiles').insert({ user_id: user.id, role, status: 'active', school_id: schoolId, email });
    if (error) throw error;
  }
  const session = await issueSession(email);
  return { id: user.id, email, token: session.access_token };
}

async function trackSchool(id) {
  if (id && !created.schools.includes(id)) {
    created.schools.push(id);
    await admin.from('schools').update({ is_test: true }).eq('id', id);
  }
}

async function login(nis, pin, schoolCode) {
  return call('auth/login', { nis, pin, schoolCode, captchaToken: CAPTCHA });
}

async function run() {
  const adm = await staffUser('admin', 'admin');
  const t1 = await staffUser('guru1');
  const t2 = await staffUser('guru2');
  const t3 = await staffUser('guru3');
  const tB = await staffUser('gurub');

  console.log('-- Akun tanpa aktivasi --');
  let r = await get('teacher/me', t1.token);
  record('teacher/me: akun Google baru belum punya profil', r.status === 200 && r.body.profile === null);
  r = await call('teacher/unlock', { studentId: '00000000-0000-0000-0000-000000000000' }, t1.token);
  record('Tindakan guru ditolak sebelum aktivasi', r.status === 403 && r.body.error === 'not_activated');
  r = await call('admin/invites', { newSchool: { name: 'X' } }, t1.token);
  record('Endpoint admin ditolak untuk non-admin', r.status === 403);
  r = await get('teacher/me');
  record('Tanpa token: 401', r.status === 401);

  console.log('\n-- Admin menerbitkan kode --');
  r = await call('admin/invites', { newSchool: { name: `SMA Uji Fase2 ${RUN}`, city: 'Kota Uji' }, days: 5 }, adm.token);
  record('Masa berlaku di luar pilihan ditolak', r.status === 400 && r.body.error === 'invalid_days');
  r = await call('admin/invites', { newSchool: { name: `SMA Uji Fase2 ${RUN}`, city: 'Kota Uji' }, days: 7, maxUses: 2 }, adm.token);
  record('Kode untuk sekolah baru diterbitkan (format XXXXX-XXXXX)', r.status === 201 && /^[A-Z2-9]{5}-[A-Z2-9]{5}$/.test(r.body.code), r.body.code);
  const codeNew = r.body.code;
  created.invites.push(r.body.id);
  const { data: invRow } = await admin.from('teacher_invites').select('code_hash').eq('id', r.body.id).single();
  record('Database hanya menyimpan hash kode', !invRow.code_hash.includes(codeNew.replace('-', '')));

  console.log('\n-- Guru menebus kode --');
  r = await call('teacher/activate', { code: 'SALAH-K0DE' }, t1.token);
  record('Kode berformat salah ditolak (berisi 0/O)', r.status === 400 && r.body.error === 'invalid_code');
  r = await call('teacher/activate', { code: 'ZZZZZ-ZZZZ2' }, t1.token);
  record('Kode tidak terdaftar ditolak', r.status === 404 && r.body.error === 'invite_not_found');
  r = await call('teacher/activate', { code: codeNew.toLowerCase().replace('-', ' ') }, t1.token);
  record('Guru 1 menebus kode (huruf kecil/spasi diterima), sekolah baru dibuat', r.status === 200 && r.body.createdSchool === true, r.body.message ?? '');
  const schoolA = r.body.schoolId;
  await trackSchool(schoolA);
  r = await call('teacher/activate', { code: codeNew }, t1.token);
  record('Tebus ulang oleh guru yang sama tidak menambah hitungan', r.status === 200 && r.body.already === true);
  r = await call('teacher/activate', { code: codeNew }, t2.token);
  record('Guru 2 memakai kode yang sama, masuk sekolah yang sama', r.status === 200 && r.body.schoolId === schoolA && !r.body.createdSchool);
  r = await call('teacher/activate', { code: codeNew }, t3.token);
  record('Guru 3 ditolak: batas pemakaian (2) tercapai', r.status === 410 && r.body.error === 'invite_exhausted');
  r = await get('teacher/me', t1.token);
  record('teacher/me: profil guru + sekolah + Kode Sekolah', r.body.profile?.role === 'teacher' && Boolean(r.body.school?.school_code));
  const schoolACode = r.body.school?.school_code;

  r = await call('admin/invites', { schoolId: schoolA, boundEmail: 'orang.lain@contoh.id', maxUses: null }, adm.token);
  created.invites.push(r.body.id);
  const bound = r.body.code;
  r = await call('teacher/activate', { code: bound }, t3.token);
  record('Kode terikat email lain ditolak', r.status === 403 && r.body.error === 'invite_email_mismatch');

  r = await call('admin/invites', { schoolId: schoolA }, adm.token);
  created.invites.push(r.body.id);
  const codeX = r.body.code, idX = r.body.id;
  await admin.from('teacher_invites').update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq('id', idX);
  r = await call('teacher/activate', { code: codeX }, t3.token);
  record('Kode kedaluwarsa ditolak', r.status === 410 && r.body.error === 'invite_expired');
  r = await call('admin/invites/extend', { inviteId: idX, days: 3 }, adm.token);
  record('Admin memperpanjang kode', r.status === 200);
  r = await call('admin/invites/revoke', { inviteId: idX }, adm.token);
  r = await call('teacher/activate', { code: codeX }, t3.token);
  record('Kode yang dicabut ditolak', r.status === 410 && r.body.error === 'invite_revoked');

  r = await get('admin/invites', adm.token);
  const listed = r.body.invites?.find((i) => i.id === created.invites[0]);
  record('Admin melihat daftar penebus (2 email)', listed?.redemptions?.length === 2 && listed.state === 'exhausted',
    listed ? `${listed.redemptions.length} penebus, ${listed.state}` : 'tidak ada');

  // Sekolah B (dibuat admin langsung) untuk uji batas sekolah
  r = await call('admin/schools', { name: `SMA Uji B ${RUN}`, npsn: '' }, adm.token);
  record('Admin membuat sekolah', r.status === 201);
  const schoolB = r.body.id;
  await trackSchool(schoolB);
  r = await call('admin/invites', { schoolId: schoolB }, adm.token);
  created.invites.push(r.body.id);
  await call('teacher/activate', { code: r.body.code }, tB.token);
  r = await call('teacher/activate', { code: codeNew }, tB.token);
  record('Guru sekolah B tidak bisa bergabung ke sekolah lain', r.status === 410 || r.body.error === 'other_school');

  console.log('\n-- Guru: kelas dan siswa --');
  const c1 = userClient(t1.token);
  const { data: kelas1, error: kErr } = await c1.from('classes').insert({ school_id: schoolA, teacher_id: t1.id, name: 'XII Uji 1' }).select().single();
  record('Guru membuat kelas lewat RLS', !kErr && Boolean(kelas1?.join_code), kErr?.message ?? '');
  const { data: kelas2 } = await c1.from('classes').insert({ school_id: schoolA, teacher_id: t1.id, name: 'XII Uji 2' }).select().single();
  const { data: kelasB } = await admin.from('classes').insert({ school_id: schoolB, name: 'Kelas B' }).select().single();

  const nis = `S${RUN}`;
  r = await call('auth/register', { classCode: kelas1.join_code, nis, name: 'Siswa Fase Dua', groupName: 'Kelompok 1',
    pin: '583914', pinConfirm: '583914', captchaToken: CAPTCHA });
  record('Siswa mendaftar di kelas guru', r.status === 201, r.body.message ?? '');
  const sid = r.body.student?.id;
  created.users.push(sid);

  r = await call('teacher/activate', { code: codeNew }, (await login(nis, '583914')).body.session.access_token);
  record('Akun siswa tidak bisa jadi guru', r.status === 403 && r.body.error === 'is_student');

  const { data: seen } = await c1.from('students').select('id').eq('id', sid);
  record('Guru 1 melihat siswanya lewat RLS', seen?.length === 1);
  const { data: notSeen } = await userClient(tB.token).from('students').select('id').eq('id', sid);
  record('Guru sekolah B tidak melihat siswa sekolah A', notSeen?.length === 0);

  for (let i = 0; i < 5; i++) await login(nis, '000001');
  r = await login(nis, '583914');
  record('Siswa terkunci setelah 5 PIN salah', r.status === 423);
  r = await call('teacher/unlock', { studentId: sid }, tB.token);
  record('Guru sekolah lain tidak bisa membuka kunci (404)', r.status === 404);
  r = await call('teacher/unlock', { studentId: sid }, t2.token);
  record('Guru lain di sekolah yang sama bisa membuka kunci (D9)', r.status === 200);
  r = await login(nis, '583914');
  record('Setelah dibuka, siswa bisa masuk', r.status === 200);

  r = await call('teacher/reset-pin', { studentId: sid }, t1.token);
  const temp = r.body.tempPin;
  record('Reset PIN memberi PIN sementara 6 angka', r.status === 200 && /^\d{6}$/.test(temp ?? ''));
  r = await login(nis, '583914');
  record('PIN lama tidak berlaku setelah reset', r.status === 401);
  r = await login(nis, temp);
  record('Masuk dengan PIN sementara: wajib ganti PIN', r.status === 200 && r.body.student?.mustChangePin === true);

  r = await call('teacher/move-student', { studentId: sid, classId: kelas2.id, groupName: 'kelompok  9' }, t1.token);
  record('Pindah siswa ke kelas lain (kelompok dibuat otomatis)', r.status === 200 && r.body.groupName === 'kelompok 9', r.body.groupName ?? r.body.message);
  r = await call('teacher/move-student', { studentId: sid, classId: kelasB.id, groupName: 'K' }, t1.token);
  record('Pindah ke kelas sekolah lain ditolak', r.status === 404 || r.status === 400);

  const newNis = `T${RUN}`;
  r = await call('teacher/update-student', { studentId: sid, nis: newNis.toLowerCase(), name: 'Siswa  Diperbaiki' }, t1.token);
  const temp2 = r.body.tempPin;
  record('Koreksi NIS otomatis mereset PIN', r.status === 200 && /^\d{6}$/.test(temp2 ?? ''));
  r = await login(nis, temp);
  record('NIS lama tidak bisa dipakai', r.status === 401);
  r = await login(newNis, temp2);
  record('NIS baru + PIN sementara bisa masuk', r.status === 200 && r.body.student?.name === 'Siswa Diperbaiki');

  r = await call('teacher/set-student-status', { studentId: sid, status: 'disabled' }, t1.token);
  record('Nonaktifkan siswa', r.status === 200);
  r = await login(newNis, temp2);
  record('Siswa nonaktif tidak bisa masuk', r.status === 401);
  r = await call('teacher/set-student-status', { studentId: sid, status: 'active' }, t1.token);
  r = await login(newNis, temp2);
  record('Diaktifkan lagi, siswa bisa masuk', r.status === 200);

  const oldJoin = kelas1.join_code;
  r = await call('teacher/rotate-join-code', { classId: kelas1.id }, t1.token);
  record('Ganti kode kelas', r.status === 200 && r.body.joinCode && r.body.joinCode !== oldJoin);
  r = await call('auth/register', { classCode: oldJoin, nis: `U${RUN}`, name: 'Telat', groupName: 'K1', pin: '583914', pinConfirm: '583914', captchaToken: CAPTCHA });
  record('Kode kelas lama tidak berlaku', r.status === 404);
  r = await call('teacher/rotate-join-code', { classId: kelasB.id }, t1.token);
  record('Guru tidak bisa mengganti kode kelas sekolah lain', r.status === 404);

  r = await call('teacher/delete-student', { studentId: sid, confirmNis: 'SALAH' }, t1.token);
  record('Hapus siswa butuh konfirmasi NIS', r.status === 400);
  r = await call('teacher/delete-student', { studentId: sid, confirmNis: newNis }, t1.token);
  record('Hapus siswa', r.status === 200);
  r = await login(newNis, temp2);
  record('Siswa yang dihapus tidak bisa masuk', r.status === 401);
  const { data: gone } = await admin.from('students').select('id').eq('id', sid);
  record('Baris siswa dan datanya ikut terhapus', gone?.length === 0);

  console.log('\n-- Admin: guru dan sekolah --');
  r = await get('admin/teachers', adm.token);
  record('Admin melihat daftar guru', r.status === 200 && r.body.teachers.some((t) => t.userId === t1.id && t.isNew));
  r = await call('admin/teachers/set-status', { userId: t2.id, status: 'disabled' }, adm.token);
  record('Admin menonaktifkan guru', r.status === 200);
  r = await call('teacher/unlock', { studentId: '00000000-0000-0000-0000-000000000000' }, t2.token);
  record('Guru nonaktif ditolak', r.status === 401 || r.status === 403, `HTTP ${r.status}`);
  const { data: hidden } = await userClient(t2.token).from('classes').select('id');
  record('Guru nonaktif tidak melihat data lewat RLS', !hidden || hidden.length === 0);
  r = await call('admin/teachers/set-status', { userId: t2.id, status: 'active' }, adm.token);
  record('Admin mengaktifkan guru lagi', r.status === 200);

  r = await call('admin/schools/rotate-code', { schoolId: schoolA }, adm.token);
  record('Admin mengganti Kode Sekolah', r.status === 200 && r.body.schoolCode !== schoolACode);
  await admin.from('schools').update({ npsn: `9${RUN.replace(/\D/g, '').padEnd(7, '1').slice(0, 7)}` }).eq('id', schoolA);
  const { data: sA } = await admin.from('schools').select('npsn').eq('id', schoolA).single();
  r = await call('admin/schools', { id: schoolB, name: `SMA Uji B ${RUN}`, npsn: sA.npsn }, adm.token);
  record('NPSN ganda ditolak', r.status === 409);
  r = await get('admin/schools', t1.token);
  record('Guru tidak bisa membaca daftar sekolah admin', r.status === 403);
  r = await call('admin/invites', { newSchool: { name: 'Sekolah NPSN Ganda', npsn: sA.npsn } }, adm.token);
  record('Kode untuk sekolah baru dengan NPSN yang sudah ada ditolak', r.status === 409);

  const { count } = await admin.from('auth_events').select('*', { count: 'exact', head: true }).eq('actor_id', t1.id);
  record('Tindakan guru tercatat di auth_events', (count ?? 0) >= 6, `${count} peristiwa`);
}

async function cleanup() {
  for (const id of created.schools) {
    const { data: st } = await admin.from('students').select('id').eq('school_id', id);
    for (const s of st ?? []) if (!created.users.includes(s.id)) created.users.push(s.id);
  }
  if (created.invites.length) await admin.from('teacher_invites').delete().in('id', created.invites);
  await admin.from('auth_events').delete().in('actor_id', created.users.filter(Boolean));
  for (const id of created.users.filter(Boolean)) await admin.auth.admin.deleteUser(id).catch(() => {});
  if (created.schools.length) await admin.from('schools').delete().in('id', created.schools);
  await admin.from('auth_events').delete().like('nis', `%${RUN}`);
}

let fatal = null;
try {
  await run();
} catch (e) {
  fatal = e;
  console.error(`\nBERHENTI: ${e.message ?? e}`);
} finally {
  await cleanup().catch((e) => console.error('Pembersihan gagal:', e.message ?? e));
}
const failed = results.filter((r) => !r.ok);
console.log(`\nHasil: ${results.length - failed.length}/${results.length} lulus. Data uji sudah dihapus.`);
for (const f of failed) console.log(`  - ${f.name}`);
process.exit(fatal || failed.length ? 1 : 0);
