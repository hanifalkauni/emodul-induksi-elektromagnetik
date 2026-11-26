// Uji Fase 6: endpoint cron (/api/ping, /api/maintenance), status operasional admin, dan simulasi rotasi PEPPER.
// Lewat handler api/index.js (sama dengan di Vercel). Membuat lalu menghapus data uji.
// Catatan: pemeliharaan berjalan untuk seluruh project (sama seperti cron sungguhan).
//
//   node --env-file=.env.local scripts/test-ops.mjs
import { randomBytes, randomUUID } from 'node:crypto';
import { handle } from '../api/index.js';
import { admin, createAuthUser, issueSession, guardNotProduction, removeStoragePrefix } from './lib/admin-client.mjs';
guardNotProduction();
if (process.env.TURNSTILE_SECRET_KEY !== '1x0000000000000000000000000000000AA') {
  console.error('Uji ini butuh kunci uji Turnstile.');
  process.exit(1);
}
const RUN = Date.now().toString(36).toUpperCase().slice(-6);
const CAPTCHA = 'XXXX.DUMMY.TOKEN.XXXX';
const BUCKET = 'emodul-uploads';
const DAY = 86_400_000;
const created = { users: [], schools: [] };
const results = [];
let ip = 1;
const ok = (name, cond, detail = '') => {
  results.push(cond);
  console.log(`${cond ? 'LULUS' : 'GAGAL'}  ${name}${detail ? `  (${detail})` : ''}`);
};
async function call(route, { body, token, method = body === undefined ? 'GET' : 'POST', auth } = {}) {
  const headers = { 'x-forwarded-for': `198.51.100.${(ip++ % 250) + 1}` };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  if (auth) headers.authorization = auth;
  const res = await handle(new Request(`http://localhost/api?route=${route}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }));
  return { status: res.status, body: await res.json() };
}
async function staffUser(label, role = null, schoolId = null) {
  const email = `uji-ops-${label}-${RUN}@emodul.test`.toLowerCase();
  const user = await createAuthUser(email);
  created.users.push(user.id);
  if (role) {
    const { error } = await admin.from('profiles').insert({ user_id: user.id, role, status: 'active', school_id: schoolId, email });
    if (error) throw error;
  }
  return { id: user.id, token: (await issueSession(email)).access_token };
}
const CRON = `Bearer ${process.env.CRON_SECRET}`;

async function run() {
  // ------------------------------------------------------------ cron: otorisasi
  let r = await call('ping');
  ok('Ping tanpa CRON_SECRET ditolak 401', r.status === 401);
  r = await call('ping', { auth: 'Bearer salah' });
  ok('Ping dengan secret salah ditolak 401', r.status === 401);
  r = await call('maintenance', { auth: `${CRON}x` });
  ok('Pemeliharaan dengan secret yang sedikit berbeda ditolak', r.status === 401);
  r = await call('ping', { method: 'POST', body: {}, auth: CRON });
  ok('Ping hanya menerima GET', r.status === 405);
  const { data: lastRun } = await admin.from('ops_runs').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
  r = await call('ping', { auth: CRON });
  ok('Ping dengan CRON_SECRET berhasil dan menyentuh database', r.status === 200 && Boolean(r.body.dbTime), JSON.stringify(r.body));
  const { data: pingRow } = await admin.from('ops_runs').select('ok, detail').eq('job', 'ping').gt('id', lastRun?.id ?? 0).order('ran_at', { ascending: false }).limit(1).maybeSingle();
  ok('Ping tercatat di ops_runs', pingRow?.ok === true);

  // ------------------------------------------------------------ data untuk pemeliharaan
  const { data: school } = await admin.from('schools').insert({ name: `UJI OPS ${RUN}`, is_test: true }).select().single();
  created.schools.push(school.id);
  const { data: klass } = await admin.from('classes').insert({ school_id: school.id, name: 'K' }).select().single();
  const { data: g } = await admin.from('groups').insert({ class_id: klass.id, name: 'G' }).select().single();
  const dir = `${school.id}/${klass.id}/${g.id}`;
  const put = async (name) => {
    const p = `${dir}/${name}-${randomUUID()}.jpg`;
    const { error } = await admin.storage.from(BUCKET).upload(p, new Blob([randomBytes(64)], { type: 'image/jpeg' }), { contentType: 'image/jpeg' });
    if (error) throw error;
    return p;
  };
  const keep = await put('process_photo');      // dirujuk group_state
  const orphan = await put('prototype_photo');  // tidak dirujuk, > 1 hari
  const fresh = await put('design_sketch');     // tidak dirujuk, baru (masih mungkin sedang dipakai)
  const untracked = await put('lab_report');    // tanpa baris files, baru: tidak boleh dihapus
  const old = new Date(Date.now() - 2 * DAY).toISOString();
  // Semua baris memakai kolom yang sama: sisipan massal PostgREST mengisi kolom yang tidak disebut dengan NULL
  const ins = await admin.from('files').insert([
    { group_id: g.id, kind: 'process_photo', storage_path: keep, created_at: old },
    { group_id: g.id, kind: 'prototype_photo', storage_path: orphan, created_at: old },
    { group_id: g.id, kind: 'design_sketch', storage_path: fresh, created_at: new Date().toISOString() },
  ]);
  if (ins.error) throw ins.error;
  await admin.from('group_state').update({ data: { processPhotoFile: { path: keep, name: 'a.jpg', size: 64, uploadedAt: old } } }).eq('group_id', g.id);
  const marker = `ops-${RUN}`;
  await admin.from('auth_events').insert([
    { school_id: school.id, event: 'login_fail', nis: marker, created_at: new Date(Date.now() - 100 * DAY).toISOString() },
    { school_id: school.id, event: 'login_fail', nis: marker, created_at: new Date(Date.now() - 10 * DAY).toISOString() },
  ]);
  await admin.from('rate_limits').insert({ key: `uji:${marker}`, window_start: new Date(Date.now() - 3 * DAY).toISOString(), count: 1 });

  r = await call('maintenance', { auth: CRON });
  ok('Pemeliharaan berjalan tanpa galat', r.status === 200 && r.body.ok === true, JSON.stringify(r.body.detail));
  const { data: ev } = await admin.from('auth_events').select('created_at').eq('nis', marker);
  ok('auth_events > 90 hari dihapus, yang baru tetap', ev?.length === 1 && Date.now() - Date.parse(ev[0].created_at) < 20 * DAY);
  const { data: rl } = await admin.from('rate_limits').select('key').eq('key', `uji:${marker}`);
  ok('Batas laju kedaluwarsa dihapus', rl?.length === 0);
  const exists = async (p) => {
    const { data } = await admin.storage.from(BUCKET).list(dir, { search: p.split('/').pop() });
    return (data ?? []).length === 1;
  };
  ok('Berkas yang dirujuk kelompok tetap ada', await exists(keep));
  ok('Berkas yatim (> 1 hari, tidak dirujuk) dihapus dari Storage', !(await exists(orphan)));
  const { data: fileRows } = await admin.from('files').select('storage_path').eq('group_id', g.id);
  const paths = (fileRows ?? []).map((x) => x.storage_path);
  ok('Baris files yatim ikut dihapus', paths.includes(keep) && !paths.includes(orphan));
  ok('Berkas baru yang belum dirujuk tidak disentuh (masa tenggang 1 hari)', (await exists(fresh)) && paths.includes(fresh));
  ok('Objek baru tanpa baris files tidak disentuh', await exists(untracked));

  // ------------------------------------------------------------ status operasional (admin)
  const adm = await staffUser('admin', 'admin');
  const teacher = await staffUser('guru', 'teacher', school.id);
  r = await call('admin/ops', { token: adm.token });
  ok('Admin melihat status cron dan pemakaian kuota', r.status === 200 && r.body.lastOkPing && r.body.lastOkMaintenance && r.body.usage?.db_bytes > 0,
    `DB ${Math.round((r.body.usage?.db_bytes ?? 0) / 1048576)} MB, Storage ${Math.round((r.body.usage?.storage_bytes ?? 0) / 1024)} KB`);
  r = await call('admin/ops', { token: teacher.token });
  ok('Guru tidak boleh membuka status operasional', r.status === 403);
  r = await call('admin/ops');
  ok('Tanpa login ditolak', r.status === 401);
  const anon = await fetch(`${process.env.SUPABASE_URL}/rest/v1/ops_runs?select=id`, { headers: { apikey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
  ok('Tabel ops_runs tidak terbaca dari klien publik', anon.status >= 400 || (await anon.json()).length === 0, `HTTP ${anon.status}`);
  const rpcAnon = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/ops_usage`, { method: 'POST', headers: { apikey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'content-type': 'application/json' }, body: '{}' });
  ok('RPC ops_usage tidak bisa dipanggil klien publik', rpcAnon.status >= 400, `HTTP ${rpcAnon.status}`);

  // ------------------------------------------------------------ simulasi rotasi PEPPER
  const oldPepper = process.env.PEPPER;
  const nis = `OPS${RUN}`;
  const pin = '583914';
  r = await call('auth/register', { body: { classCode: klass.join_code, nis, name: 'Siswa Rotasi', groupName: 'G', pin, pinConfirm: pin, captchaToken: CAPTCHA } });
  if (r.body.student?.id) created.users.push(r.body.student.id);
  ok('Siswa terdaftar dengan PEPPER lama', r.status === 200 || r.status === 201, `HTTP ${r.status}`);
  const sid = r.body.student?.id;
  const { data: s0 } = await admin.from('student_secrets').select('pin_hash').eq('student_id', sid).single();
  r = await call('admin/invites', { body: { schoolId: school.id, days: 3 }, token: adm.token });
  const inviteCode = r.body.code;

  const newPepper = randomBytes(32).toString('hex');
  try {
    process.env.PEPPER = newPepper;
    delete process.env.PEPPER_PREVIOUS;
    r = await call('auth/login', { body: { nis, pin, captchaToken: CAPTCHA } });
    ok('Tanpa PEPPER_PREVIOUS: PIN lama tidak berlaku setelah ganti PEPPER (alasan runbook)', r.status === 401);
    await admin.from('student_secrets').update({ failed_attempts: 0 }).eq('student_id', sid);
    await admin.from('students').update({ locked_until: null }).eq('id', sid);

    process.env.PEPPER_PREVIOUS = oldPepper;
    r = await call('auth/login', { body: { nis, pin, captchaToken: CAPTCHA } });
    ok('Dengan PEPPER_PREVIOUS: siswa tetap bisa masuk', r.status === 200, `HTTP ${r.status}`);
    const { data: s1 } = await admin.from('student_secrets').select('pin_hash').eq('student_id', sid).single();
    ok('PIN di-hash ulang dengan PEPPER baru saat masuk', s1.pin_hash !== s0.pin_hash);
    r = await call('auth/login', { body: { nis, pin: '609172', captchaToken: CAPTCHA } });
    ok('PIN salah tetap ditolak selama rotasi', r.status === 401);
    await admin.from('student_secrets').update({ failed_attempts: 0 }).eq('student_id', sid);

    const t2 = await staffUser('guru-baru');
    r = await call('teacher/activate', { body: { code: inviteCode }, token: t2.token });
    ok('Kode aktivasi yang terbit sebelum rotasi tetap bisa ditebus', r.status === 200, `HTTP ${r.status} ${r.body.error ?? ''}`);

    delete process.env.PEPPER_PREVIOUS;
    r = await call('auth/login', { body: { nis, pin, captchaToken: CAPTCHA } });
    ok('Setelah PEPPER_PREVIOUS dihapus, siswa yang sudah di-hash ulang tetap bisa masuk', r.status === 200, `HTTP ${r.status}`);
  } finally {
    process.env.PEPPER = oldPepper;
    delete process.env.PEPPER_PREVIOUS;
  }
}

async function cleanup() {
  for (const id of created.schools) await removeStoragePrefix(id).catch(() => {});
  for (const id of created.users) await admin.auth.admin.deleteUser(id).catch(() => {});
  if (created.schools.length) await admin.from('schools').delete().in('id', created.schools);
  await admin.from('auth_events').delete().like('nis', `OPS${RUN}%`);
  await admin.from('auth_events').delete().eq('nis', `ops-${RUN}`);
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
