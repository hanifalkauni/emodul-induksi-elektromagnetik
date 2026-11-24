// Uji Fase 1: endpoint daftar / masuk / ganti PIN, dipanggil langsung lewat handler api/index.js
// (sama dengan yang dijalankan Vercel). Membuat sekolah uji sementara lalu menghapus semuanya.
//
//   node --env-file=.env.local scripts/test-auth.mjs
//
// Butuh kunci uji Turnstile di .env.local (TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA).

import { handle } from '../api/index.js';
import { admin, userClient, guardNotProduction } from './lib/admin-client.mjs';

guardNotProduction();
if (process.env.TURNSTILE_SECRET_KEY !== '1x0000000000000000000000000000000AA') {
  console.error('Uji ini butuh kunci uji Turnstile (TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA).');
  process.exit(1);
}

const RUN = Date.now().toString(36).toUpperCase().slice(-6);
const CAPTCHA = 'XXXX.DUMMY.TOKEN.XXXX';
const results = [];
const created = { schools: [] };
let ipCounter = 10;

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'LULUS' : 'GAGAL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

/** Panggil endpoint. Setiap panggilan memakai IP uji berbeda kecuali diminta, agar batas laju per IP tidak terpicu. */
async function call(route, body, { token, ip } = {}) {
  const headers = { 'content-type': 'application/json', 'x-forwarded-for': ip ?? `198.51.100.${(ipCounter++ % 250) + 1}` };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await handle(new Request(`http://localhost/api?route=${route}`, {
    method: 'POST', headers, body: JSON.stringify(body),
  }));
  return { status: res.status, body: await res.json() };
}

async function makeSchoolWithClass(label) {
  const { data: school, error } = await admin.from('schools')
    .insert({ name: `UJI AUTH ${label} ${RUN}`, is_test: true }).select().single();
  if (error) throw error;
  created.schools.push(school.id);
  const { data: klass, error: cErr } = await admin.from('classes')
    .insert({ school_id: school.id, name: `Kelas ${label}` }).select().single();
  if (cErr) throw cErr;
  return { school, klass };
}

const NIS = `N${RUN}`;

async function run() {
  const A = await makeSchoolWithClass('A');
  const B = await makeSchoolWithClass('B');

  console.log('-- Daftar --');
  const base = { classCode: A.klass.join_code, nis: NIS, name: 'Siswa Uji', groupName: 'Kelompok 7', captchaToken: CAPTCHA };

  let r = await call('auth/register', { ...base, pin: '123456', pinConfirm: '123456' });
  record('PIN berurutan ditolak', r.status === 400 && r.body.error === 'weak_pin', r.body.message);
  r = await call('auth/register', { ...base, pin: '777777', pinConfirm: '777777' });
  record('PIN angka sama ditolak', r.status === 400 && r.body.error === 'weak_pin', r.body.message);
  r = await call('auth/register', { ...base, pin: '482915', pinConfirm: '482910' });
  record('Konfirmasi PIN berbeda ditolak', r.status === 400 && r.body.error === 'pin_mismatch');
  r = await call('auth/register', { ...base, classCode: 'ZZZZZZ', pin: '482915', pinConfirm: '482915' });
  record('Kode kelas salah ditolak', r.status === 404 && r.body.error === 'class_not_found');
  r = await call('auth/register', { ...base, pin: '482915', pinConfirm: '482915', captchaToken: '' });
  record('Tanpa CAPTCHA ditolak', r.status === 400 && r.body.error === 'captcha_required');

  r = await call('auth/register', { ...base, nis: ` ${NIS.toLowerCase()} `, pin: '482915', pinConfirm: '482915' });
  const regOk = r.status === 201 && r.body.session?.access_token;
  record('Daftar berhasil dan sesi terbit', Boolean(regOk), regOk ? '' : `${r.status} ${r.body.message}`);
  if (!regOk) throw new Error('Pendaftaran gagal; uji dihentikan.');
  const studentA = r.body.student;
  record('NIS dinormalisasi (spasi dibuang, huruf besar)', studentA.nis === NIS, studentA.nis);
  record('Respons berisi Kode Sekolah dan nama kelas', studentA.schoolCode === A.school.school_code && studentA.className === 'Kelas A');

  const client = userClient(r.body.session.access_token);
  const { data: st } = await client.from('student_state').select('student_id').eq('student_id', studentA.id);
  record('Sesi dari pendaftaran bisa membaca student_state sendiri', st?.length === 1);

  r = await call('auth/register', { ...base, name: 'Penyusup', pin: '593017', pinConfirm: '593017' });
  record('NIS yang sama di sekolah yang sama ditolak', r.status === 409 && r.body.error === 'nis_taken');

  r = await call('auth/register', { ...base, nis: `M${RUN}`, name: 'Teman Sekelompok', groupName: 'kelompok   7', pin: '593017', pinConfirm: '593017' });
  record('Nama kelompok beda huruf/spasi masuk kelompok yang sama', r.status === 201 && r.body.student?.groupName === 'Kelompok 7',
    r.body.student?.groupName ?? r.body.message);

  console.log('\n-- Masuk --');
  r = await call('auth/login', { nis: NIS, pin: '482915', captchaToken: CAPTCHA });
  record('Masuk dengan NIS + PIN saja', r.status === 200 && Boolean(r.body.session?.access_token), r.body.message ?? '');
  r = await call('auth/login', { nis: NIS.toLowerCase(), pin: '482915', captchaToken: CAPTCHA });
  record('NIS huruf kecil tetap dikenali', r.status === 200);
  r = await call('auth/login', { nis: 'TIDAKADA999', pin: '482915', captchaToken: CAPTCHA });
  record('NIS tidak terdaftar: pesan galat umum', r.status === 401 && r.body.message === 'NIS atau PIN salah.');
  r = await call('auth/login', { nis: NIS, pin: '000001', captchaToken: CAPTCHA });
  record('PIN salah: pesan galat yang sama', r.status === 401 && r.body.message === 'NIS atau PIN salah.');

  console.log('\n-- Kunci akun (5x salah / 15 menit) --');
  for (let i = 0; i < 3; i++) await call('auth/login', { nis: NIS, pin: '000001', captchaToken: CAPTCHA });
  r = await call('auth/login', { nis: NIS, pin: '000001', captchaToken: CAPTCHA });
  record('Percobaan salah ke-5 mengunci akun', r.status === 423 && r.body.error === 'account_locked', r.body.message);
  r = await call('auth/login', { nis: NIS, pin: '482915', captchaToken: CAPTCHA });
  record('PIN benar pun ditolak selama terkunci', r.status === 423);
  const { data: lockedRow } = await admin.from('students').select('locked_until').eq('id', studentA.id).single();
  const lockMin = (new Date(lockedRow.locked_until).getTime() - Date.now()) / 60000;
  record('Durasi kunci sekitar 15 menit', lockMin > 14 && lockMin <= 15.1, `${lockMin.toFixed(1)} menit`);

  // Simulasi guru membuka kunci (Fase 2 menyediakan endpointnya)
  await admin.from('students').update({ locked_until: null }).eq('id', studentA.id);
  r = await call('auth/login', { nis: NIS, pin: '482915', captchaToken: CAPTCHA });
  record('Setelah kunci dibuka, PIN benar diterima', r.status === 200);
  const { data: sec } = await admin.from('student_secrets').select('failed_attempts').eq('student_id', studentA.id).single();
  record('Hitungan gagal kembali 0 setelah berhasil', sec.failed_attempts === 0);

  console.log('\n-- NIS sama di dua sekolah --');
  r = await call('auth/register', { classCode: B.klass.join_code, nis: NIS, name: 'Siswa Sekolah B', groupName: 'Kelompok 1',
    pin: '482915', pinConfirm: '482915', captchaToken: CAPTCHA });
  record('Pendaftaran tidak menolak PIN yang kebetulan sama dengan sekolah lain', r.status === 201, r.body.message ?? '');
  const studentB = r.body.student;
  r = await call('auth/login', { nis: NIS, pin: '482915', captchaToken: CAPTCHA });
  record('NIS + PIN sama di dua sekolah: minta Kode Sekolah', r.status === 409 && r.body.needSchoolCode === true);
  r = await call('auth/login', { nis: NIS, pin: '482915', schoolCode: B.school.school_code, captchaToken: CAPTCHA });
  record('Dengan Kode Sekolah, masuk ke akun yang benar', r.status === 200 && r.body.student?.id === studentB.id);
  r = await call('auth/login', { nis: NIS, pin: '482915', schoolCode: 'ZZZZZZ', captchaToken: CAPTCHA });
  record('Kode Sekolah salah ditolak', r.status === 401);

  console.log('\n-- Ganti PIN --');
  r = await call('auth/login', { nis: NIS, pin: '482915', schoolCode: A.school.school_code, captchaToken: CAPTCHA });
  const token = r.body.session?.access_token;
  r = await call('auth/change-pin', { oldPin: '000001', newPin: '640281', newPinConfirm: '640281' }, { token });
  record('Ganti PIN dengan PIN lama salah ditolak', r.status === 401 && r.body.error === 'invalid_old_pin');
  r = await call('auth/change-pin', { oldPin: '482915', newPin: '482915', newPinConfirm: '482915' }, { token });
  record('PIN baru sama dengan PIN lama ditolak', r.status === 400 && r.body.error === 'same_pin');
  r = await call('auth/change-pin', { oldPin: '482915', newPin: '640281', newPinConfirm: '640281' }, { token });
  record('Ganti PIN berhasil', r.status === 200, r.body.message ?? '');
  r = await call('auth/login', { nis: NIS, pin: '640281', schoolCode: A.school.school_code, captchaToken: CAPTCHA });
  record('Masuk dengan PIN baru berhasil', r.status === 200);
  r = await call('auth/login', { nis: NIS, pin: '482915', schoolCode: A.school.school_code, captchaToken: CAPTCHA });
  record('PIN lama tidak berlaku lagi', r.status === 401);
  r = await call('auth/change-pin', { oldPin: '640281', newPin: '715392', newPinConfirm: '715392' });
  record('Ganti PIN tanpa sesi ditolak', r.status === 401 && r.body.error === 'unauthenticated');

  // must_change_pin (dipakai setelah guru mereset PIN di Fase 2): PIN lama tidak diperlukan
  await admin.from('students').update({ must_change_pin: true }).eq('id', studentA.id);
  r = await call('auth/login', { nis: NIS, pin: '640281', schoolCode: A.school.school_code, captchaToken: CAPTCHA });
  record('Login memberi tahu must_change_pin', r.status === 200 && r.body.student?.mustChangePin === true);
  r = await call('auth/change-pin', { newPin: '715392', newPinConfirm: '715392' }, { token: r.body.session?.access_token });
  record('must_change_pin: ganti PIN tanpa PIN lama', r.status === 200, r.body.message ?? '');
  const { data: flag } = await admin.from('students').select('must_change_pin').eq('id', studentA.id).single();
  record('must_change_pin dimatikan setelah ganti', flag.must_change_pin === false);

  console.log('\n-- Rahasia dan pembatas laju --');
  const { data: secRow } = await admin.from('student_secrets').select('pin_hash').eq('student_id', studentA.id).single();
  record('PIN tersimpan sebagai hash scrypt, bukan teks', secRow.pin_hash.startsWith('scrypt$') && !secRow.pin_hash.includes('715392'));
  const { count: evCount } = await admin.from('auth_events').select('*', { count: 'exact', head: true }).eq('student_id', studentA.id);
  record('Peristiwa akun tercatat di auth_events', (evCount ?? 0) >= 5, `${evCount} peristiwa`);
  const { data: evRows } = await admin.from('auth_events').select('ip_hash').eq('student_id', studentA.id).limit(1);
  record('IP tidak disimpan mentah', Boolean(evRows?.[0]?.ip_hash) && !evRows[0].ip_hash.includes('198.51.100'));

  const sameIp = '203.0.113.77';
  let limited = false;
  for (let i = 0; i < 65; i++) {
    const res = await call('auth/login', { nis: 'RATE0001', pin: '000001', captchaToken: CAPTCHA }, { ip: sameIp });
    if (res.status === 429) { limited = true; break; }
  }
  record('Batas laju per IP menolak percobaan berlebihan (429)', limited);

  r = await call('auth/unknown', {});
  record('Endpoint tak dikenal: 404', r.status === 404);
}

async function cleanup() {
  for (const schoolId of created.schools) {
    const { data: students } = await admin.from('students').select('id').eq('school_id', schoolId);
    for (const s of students ?? []) await admin.auth.admin.deleteUser(s.id);
  }
  if (created.schools.length) await admin.from('schools').delete().in('id', created.schools);
  await admin.from('auth_events').delete().in('nis', [NIS, `M${RUN}`, 'TIDAKADA999', 'RATE0001']);
  // Baris rate_limits uji tidak dihapus: kuncinya di-hash sehingga tidak bisa dipilah dari data nyata,
  // dan semuanya kedaluwarsa sendiri setelah jendela waktunya lewat (maks. 1 jam).
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
for (const f of failed) console.log(`  - ${f.name}  ${f.detail}`);
process.exit(fatal || failed.length ? 1 : 0);
