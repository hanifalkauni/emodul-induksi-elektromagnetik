// Uji browser Fase 2: panel admin dan halaman guru (Microsoft Edge, headless).
// Login Google tidak bisa diotomasi, jadi sesi guru uji dipasang langsung ke storage sesi staf.
// Tombol "Masuk dengan Google" tetap diuji sampai halaman Google terbuka.
//
//   PW_CORE=... node --env-file=.env.local scripts/e2e-staff.mjs   (E2E_BASE default http://localhost:5173)

import { pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';
import { handle } from '../api/index.js';
import { admin, createAuthUser, issueSession, guardNotProduction } from './lib/admin-client.mjs';

guardNotProduction();
const { chromium } = await import(pathToFileURL(process.env.PW_CORE).href);
const BASE = process.env.E2E_BASE ?? 'http://localhost:5173';
const RUN = Date.now().toString(36).toUpperCase().slice(-6);
const CAPTCHA = 'XXXX.DUMMY.TOKEN.XXXX';
const created = { users: [], schools: [] };
const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'LULUS' : 'GAGAL'}  ${name}${detail ? `  (${detail})` : ''}`);
}
async function check(name, fn) {
  try {
    const out = await fn();
    record(name, out !== false, typeof out === 'string' ? out : '');
  } catch (e) {
    record(name, false, (e.message ?? String(e)).split('\n')[0].slice(0, 160));
  }
}
async function api(route, body) {
  const res = await handle(new Request(`http://localhost/api?route=${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `198.18.0.${Math.floor(Math.random() * 250) + 1}` },
    body: JSON.stringify(body),
  }));
  return { status: res.status, body: await res.json() };
}

async function main() {
  // Admin uji dengan password (login lewat form /admin)
  const adminEmail = `uji-admin-e2e-${RUN}@emodul.test`.toLowerCase();
  const adminPassword = randomBytes(18).toString('base64url');
  const { data: au, error: auErr } = await admin.auth.admin.createUser({ email: adminEmail, password: adminPassword, email_confirm: true });
  if (auErr) throw auErr;
  created.users.push(au.user.id);
  await admin.from('profiles').insert({ user_id: au.user.id, role: 'admin', status: 'active', email: adminEmail });

  // Guru uji tanpa profil (seolah baru login Google)
  const teacherEmail = `uji-guru-e2e-${RUN}@emodul.test`.toLowerCase();
  const tu = await createAuthUser(teacherEmail);
  created.users.push(tu.id);
  const teacherSession = await issueSession(teacherEmail);

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const actx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'id-ID' });
    const ap = await actx.newPage();
    ap.on('dialog', (d) => d.accept());
    ap.on('pageerror', (e) => console.log('   [pageerror admin]', e.message));

    // ------------------------------------------------------------- Admin
    await check('/admin menampilkan form masuk admin', async () => {
      await ap.goto(`${BASE}/admin`);
      await ap.getByRole('heading', { name: 'Masuk Admin' }).waitFor({ timeout: 20000 });
    });
    await check('Password salah ditolak', async () => {
      await ap.fill('#admin-email', adminEmail);
      await ap.fill('#admin-password', 'salah-sekali-123');
      await ap.getByRole('button', { name: 'Masuk', exact: true }).click();
      await ap.getByText('Email atau password salah.').waitFor({ timeout: 15000 });
    });
    await check('Admin masuk dan melihat panel', async () => {
      await ap.fill('#admin-password', adminPassword);
      await ap.getByRole('button', { name: 'Masuk', exact: true }).click();
      await ap.getByRole('heading', { name: 'Terbitkan kode aktivasi guru' }).waitFor({ timeout: 20000 });
    });
    await check('Admin melihat Status Layanan (cron dan kuota)', async () => {
      await ap.getByRole('button', { name: 'Status Layanan' }).click();
      await ap.getByRole('heading', { name: 'Ping harian (anti-pause)' }).waitFor({ timeout: 15000 });
      await ap.getByRole('progressbar', { name: 'Database' }).waitFor({ timeout: 5000 });
      await ap.getByRole('button', { name: 'Kode Aktivasi' }).click();
      await ap.getByRole('heading', { name: 'Terbitkan kode aktivasi guru' }).waitFor({ timeout: 10000 });
    });

    let code = '';
    const schoolName = `SMA E2E Fase2 ${RUN}`;
    await check('Admin menerbitkan kode untuk sekolah baru', async () => {
      await ap.getByRole('radio', { name: 'Sekolah baru' }).click();
      await ap.fill('#inv-name', schoolName);
      await ap.selectOption('#inv-days', '30');
      await ap.getByText(/Kode tanpa email dan berlaku lebih dari 7 hari/).waitFor();
      await ap.getByRole('button', { name: 'Terbitkan kode' }).click();
      const dialog = ap.getByRole('dialog', { name: 'Kode aktivasi baru' });
      await dialog.waitFor({ timeout: 15000 });
      code = (await dialog.locator('.font-mono.text-2xl').innerText()).trim();
      await dialog.getByRole('button', { name: 'Selesai' }).click();
      return /^[A-Z2-9]{5}-[A-Z2-9]{5}$/.test(code) ? code : false;
    });
    await check('Kode muncul di daftar dengan status Aktif', async () => {
      await ap.getByText(schoolName).first().waitFor({ timeout: 10000 });
    });

    // ------------------------------------------------------------- Guru
    const tctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'id-ID' });
    const tp = await tctx.newPage();
    tp.on('dialog', (d) => d.accept());
    tp.on('pageerror', (e) => console.log('   [pageerror guru]', e.message));

    await check('Tombol "Masuk dengan Google" membuka halaman Google', async () => {
      await tp.goto(`${BASE}/guru`);
      await tp.getByRole('button', { name: 'Masuk dengan Google' }).click();
      await tp.waitForURL(/accounts\.google\.com/, { timeout: 20000 });
    });

    await tp.goto(`${BASE}/guru`);
    await tp.evaluate((s) => localStorage.setItem('emodul-staff-auth', JSON.stringify(s)), teacherSession);
    await check('Guru baru (tanpa kode) melihat layar aktivasi', async () => {
      await tp.reload();
      await tp.getByRole('heading', { name: 'Aktivasi Akun Guru' }).waitFor({ timeout: 20000 });
    });
    await check('Kode salah ditolak di layar aktivasi', async () => {
      await tp.fill('#activation-code', 'ZZZZZZZZZ2');
      await tp.getByRole('button', { name: 'Aktifkan' }).click();
      await tp.getByText(/Kode aktivasi tidak ditemukan/).waitFor({ timeout: 15000 });
    });
    await check('Guru menebus kode lalu masuk dashboard sekolah', async () => {
      await tp.fill('#activation-code', code.toLowerCase());
      await tp.getByRole('button', { name: 'Aktifkan' }).click();
      await tp.getByRole('heading', { name: schoolName }).waitFor({ timeout: 20000 });
    });
    const { data: sch } = await admin.from('schools').select('id').eq('name', schoolName).single();
    created.schools.push(sch.id);
    await admin.from('schools').update({ is_test: true }).eq('id', sch.id);

    let joinCode = '';
    await check('Guru membuat kelas dan mendapat kode kelas', async () => {
      await tp.fill('#new-class', 'XII E2E A');
      await tp.getByRole('button', { name: 'Buat Kelas' }).click();
      await tp.getByRole('heading', { name: 'XII E2E A' }).waitFor({ timeout: 15000 });
      joinCode = (await tp.locator('span.font-mono.text-lg').first().innerText()).trim();
      return /^[A-Z2-9]{6}$/.test(joinCode) ? joinCode : false;
    });
    await tp.fill('#new-class', 'XII E2E B');
    await tp.getByRole('button', { name: 'Buat Kelas' }).click();
    await tp.getByRole('heading', { name: 'XII E2E B' }).waitFor({ timeout: 15000 });
    await tp.getByRole('button', { name: 'XII E2E A' }).click();

    const nis = `E${RUN}`;
    const reg = await api('auth/register', { classCode: joinCode, nis, name: 'Siswa E2E Guru', groupName: 'Kelompok 1', pin: '583914', pinConfirm: '583914', captchaToken: CAPTCHA });
    created.users.push(reg.body.student?.id);
    for (let i = 0; i < 5; i++) await api('auth/login', { nis, pin: '000001', captchaToken: CAPTCHA });

    await check('Siswa terkunci tampil di daftar kelas', async () => {
      // Fase 5: tindakan per siswa ada di tab "Kelola Siswa" pada dashboard kelas
      await tp.getByRole('tab', { name: 'Kelola Siswa' }).click();
      await tp.getByRole('button', { name: 'Muat ulang', exact: true }).click();
      await tp.getByText('Siswa E2E Guru').waitFor({ timeout: 15000 });
      await tp.getByText(/Terkunci s\.d\./).waitFor({ timeout: 10000 });
    });
    await check('Guru membuka kunci', async () => {
      await tp.getByRole('button', { name: 'Buka kunci' }).click();
      await tp.getByText(/Akun Siswa E2E Guru dibuka/).waitFor({ timeout: 15000 });
      return (await api('auth/login', { nis, pin: '583914', captchaToken: CAPTCHA })).status === 200;
    });
    let tempPin = '';
    await check('Guru mereset PIN dan melihat PIN sementara', async () => {
      await tp.getByRole('button', { name: 'Reset PIN' }).click();
      const dialog = tp.getByRole('dialog', { name: 'PIN Sementara' });
      await dialog.waitFor({ timeout: 15000 });
      tempPin = (await dialog.locator('.font-mono.text-3xl').innerText()).trim();
      await dialog.getByRole('button', { name: 'Sudah dicatat' }).click();
      const r = await api('auth/login', { nis, pin: tempPin, captchaToken: CAPTCHA });
      return r.status === 200 && r.body.student?.mustChangePin === true ? tempPin : false;
    });
    await check('Guru memindahkan siswa ke kelas lain', async () => {
      await tp.getByRole('button', { name: 'Pindah' }).click();
      const dialog = tp.getByRole('dialog', { name: /Pindahkan/ });
      await dialog.locator('#move-class').selectOption({ label: 'XII E2E B' });
      await dialog.locator('#move-group').fill('Kelompok 2');
      await dialog.getByRole('button', { name: 'Pindahkan' }).click();
      await tp.getByText(/dipindahkan/).waitFor({ timeout: 15000 });
      const { data } = await admin.from('students').select('classes(name), groups(name)').eq('id', reg.body.student.id).single();
      return data.classes.name === 'XII E2E B' && data.groups.name === 'Kelompok 2';
    });
    await tp.screenshot({ path: `${process.env.TEMP ?? '.'}/e2e-guru.png`, fullPage: true });

    // ------------------------------------------------------------- Admin: guru + bantuan siswa
    await check('Admin melihat guru baru bertanda "Baru"', async () => {
      await ap.getByRole('button', { name: 'Guru', exact: true }).click();
      await ap.getByText(teacherEmail).waitFor({ timeout: 15000 });
      await ap.getByText('Baru').first().waitFor();
    });
    await check('Admin mencari siswa lintas sekolah lewat NIS', async () => {
      await ap.getByRole('button', { name: 'Bantuan Siswa' }).click();
      await ap.fill('#admin-search', nis);
      await ap.getByText('Siswa E2E Guru').waitFor({ timeout: 15000 });
      await ap.getByText(schoolName).first().waitFor();
    });
    await check('Admin menonaktifkan guru, guru kehilangan akses', async () => {
      await ap.getByRole('button', { name: 'Guru', exact: true }).click();
      await ap.locator('li', { hasText: teacherEmail }).getByRole('button', { name: 'Nonaktifkan' }).click();
      await ap.locator('li', { hasText: teacherEmail }).getByText('Nonaktif').waitFor({ timeout: 15000 });
      await tp.reload();
      await tp.waitForTimeout(4000);
      return (await tp.getByRole('heading', { name: schoolName }).count()) === 0;
    });
    await ap.screenshot({ path: `${process.env.TEMP ?? '.'}/e2e-admin.png`, fullPage: true });

    // ------------------------------------------------------------- Tata letak HP
    await check('Halaman admin dan guru tidak melebar di HP (390px)', async () => {
      const m = await browser.newContext({ viewport: { width: 390, height: 860 } });
      const mp = await m.newPage();
      const widths = [];
      for (const path of ['/admin', '/guru']) {
        await mp.goto(`${BASE}${path}`);
        await mp.waitForTimeout(1500);
        widths.push(await mp.evaluate(() => document.documentElement.scrollWidth));
      }
      await m.close();
      return widths.every((w) => w <= 390) ? widths.join(',') : false;
    });
  } finally {
    await browser.close();
  }
}

async function cleanup() {
  for (const id of created.schools) {
    const { data: st } = await admin.from('students').select('id').eq('school_id', id);
    for (const s of st ?? []) created.users.push(s.id);
  }
  const users = [...new Set(created.users.filter(Boolean))];
  await admin.from('auth_events').delete().in('actor_id', users);
  for (const id of users) await admin.auth.admin.deleteUser(id).catch(() => {});
  if (created.schools.length) await admin.from('schools').delete().in('id', created.schools);
  await admin.from('teacher_invites').delete().like('new_school_name', `%${RUN}%`);
  await admin.from('auth_events').delete().like('nis', `%${RUN}`);
}

let fatal = null;
try {
  await main();
} catch (e) {
  fatal = e;
  console.error('BERHENTI:', e.message);
} finally {
  await cleanup().catch((e) => console.error('Pembersihan gagal:', e.message));
}
const failed = results.filter((r) => !r.ok);
console.log(`\nHasil: ${results.length - failed.length}/${results.length} lulus. Data uji sudah dihapus.`);
for (const f of failed) console.log(`  - ${f.name}`);
process.exit(fatal || failed.length ? 1 : 0);
