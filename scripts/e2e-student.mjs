// Uji ujung-ke-ujung Fase 1 di browser sungguhan (Microsoft Edge, headless).
// Butuh: `npm run dev` berjalan di http://localhost:5173, kunci uji Turnstile, dan playwright-core.
//
//   npm i playwright-core --prefix %TEMP%\pw        (sekali, di luar proyek)
//   set PW_CORE=%TEMP%\pw\node_modules\playwright-core\index.mjs
//   node --env-file=.env.local scripts/e2e-student.mjs

import { pathToFileURL } from 'node:url';
import { admin, guardNotProduction } from './lib/admin-client.mjs';

guardNotProduction();
const { chromium } = await import(process.env.PW_CORE ? pathToFileURL(process.env.PW_CORE).href : 'playwright-core');
const BASE = process.env.E2E_BASE ?? 'http://localhost:5173';
const RUN = Date.now().toString(36).toUpperCase().slice(-6);
const results = [];
let schoolId = null;

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
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

async function newPage(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'id-ID' });
  const page = await context.newPage();
  page.on('dialog', (d) => d.accept());
  page.on('pageerror', (e) => console.log('   [pageerror]', e.message));
  await page.goto(BASE);
  return { context, page };
}

async function waitCaptchaAndSubmit(page, label) {
  const btn = page.locator('form button[type="submit"]', { hasText: label });
  await btn.waitFor();
  await page.waitForFunction((t) => {
    const b = [...document.querySelectorAll('form button[type="submit"]')].find((x) => x.textContent.includes(t));
    return b && !b.disabled;
  }, label, { timeout: 30000 });
  await btn.click();
}

async function register(page, { classCode, nis, name, group, pin }) {
  await page.getByRole('tab', { name: 'Daftar Baru' }).click();
  await page.fill('#reg-class', classCode);
  await page.fill('#reg-nis', nis);
  await page.fill('#reg-name', name);
  await page.fill('#reg-group', group);
  await page.fill('#reg-pin', pin);
  await page.fill('#reg-pin2', pin);
  await waitCaptchaAndSubmit(page, 'Daftar');
  await page.getByRole('heading', { name: `Halo, ${name}` }).waitFor({ timeout: 30000 });
}

async function login(page, { nis, pin }) {
  await page.fill('#login-nis', nis);
  await page.fill('#login-pin', pin);
  await waitCaptchaAndSubmit(page, 'Masuk');
}

async function waitSynced(page) {
  await page.getByText('Tersinkron ke akun').first().waitFor({ timeout: 20000 });
}

async function goToScreen(page, shortTitle) {
  await page.locator('aside nav button', { hasText: shortTitle }).first().click();
}

async function serverHypothesis(nis) {
  const { data: s } = await admin.from('students').select('id').eq('school_id', schoolId).eq('nis', nis).single();
  const { data } = await admin.from('student_state').select('data, current_screen').eq('student_id', s.id).single();
  return data;
}

async function signOutFromSidebar(page) {
  await page.getByRole('button', { name: 'Keluar dari akun' }).click();
  await page.getByRole('heading', { name: 'Masuk ke Akun Siswa' }).waitFor({ timeout: 15000 });
}

async function main() {
  const { data: school, error } = await admin.from('schools').insert({ name: `UJI E2E ${RUN}`, is_test: true }).select().single();
  if (error) throw error;
  schoolId = school.id;
  const { data: klass } = await admin.from('classes').insert({ school_id: school.id, name: 'XII E2E' }).select().single();

  const s1 = { classCode: klass.join_code, nis: `E1${RUN}`, name: 'Siswa Satu', group: 'Kelompok A', pin: '583914' };
  const s2 = { classCode: klass.join_code, nis: `E2${RUN}`, name: 'Siswa Dua', group: 'Kelompok A', pin: '609172' };

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    // ---------------------------------------------------------------- Perangkat 1
    const d1 = await newPage(browser);
    const p1 = d1.page;

    await check('Screen 1 menampilkan panel masuk akun', async () => {
      await p1.getByRole('heading', { name: 'Masuk ke Akun Siswa' }).waitFor({ timeout: 15000 });
    });

    await check('Daftar lewat UI (CAPTCHA uji lolos) lalu masuk otomatis', () => register(p1, s1));
    await check('Identitas dari akun tampil (kelas + kelompok)', async () => {
      await p1.getByText('XII E2E').first().waitFor();
      await p1.getByText('Kelompok A').first().waitFor();
    });
    await check('Badge sinkron: "Tersinkron ke akun"', () => waitSynced(p1));
    await check('Tombol "Contoh Data" disembunyikan di mode online', async () =>
      (await p1.getByRole('button', { name: /Contoh Data/ }).count()) === 0);

    await p1.getByRole('button', { name: 'MULAI PEMBELAJARAN' }).click();
    await goToScreen(p1, 'Pemantik');
    const hyp1 = `Hipotesis dari perangkat 1 ${RUN}`;
    await p1.fill('#hypothesis-input', hyp1);
    await check('Jawaban tersinkron ke server (debounce 1,5 detik)', async () => {
      await p1.waitForTimeout(800);
      await waitSynced(p1);
      const row = await serverHypothesis(s1.nis);
      return row.data.initialHypothesis === hyp1 && row.current_screen === 5;
    });

    // ---------------------------------------------------------------- Perangkat 2
    const d2 = await newPage(browser);
    const p2 = d2.page;
    await check('Perangkat 2: masuk dengan NIS + PIN saja', () => login(p2, s1));
    await check('Perangkat 2: jawaban dari perangkat 1 muncul (lanjut di Screen 5)', async () => {
      await p2.locator('#hypothesis-input').waitFor({ timeout: 20000 });
      return (await p2.inputValue('#hypothesis-input')) === hyp1;
    });
    const hyp2 = `Diperbarui dari perangkat 2 ${RUN}`;
    await p2.fill('#hypothesis-input', hyp2);
    await p2.waitForTimeout(800);
    await waitSynced(p2);
    await check('Perangkat 1 dimuat ulang: data server yang lebih baru dipakai', async () => {
      await p1.reload();
      await p1.locator('#hypothesis-input').waitFor({ timeout: 20000 });
      await waitSynced(p1);
      return (await p1.inputValue('#hypothesis-input')) === hyp2;
    });

    // ---------------------------------------------------------------- Offline
    await check('Offline: perubahan disimpan di perangkat dan badge memberi tahu', async () => {
      await d1.context.setOffline(true);
      await p1.fill('#hypothesis-input', `${hyp2} + offline`);
      await p1.getByText(/Offline, disimpan di perangkat|Belum tersinkron/).first().waitFor({ timeout: 20000 });
    });
    await check('Online kembali: perubahan offline terkirim', async () => {
      await d1.context.setOffline(false);
      await waitSynced(p1);
      return (await serverHypothesis(s1.nis)).data.initialHypothesis === `${hyp2} + offline`;
    });

    // ---------------------------------------------------------------- Keluar + komputer lab
    await check('Keluar: data lokal dihapus dari perangkat', async () => {
      await goToScreen(p1, 'Cover');
      await signOutFromSidebar(p1);
      const raw = await p1.evaluate(() => localStorage.getItem('emodul_induksi_elektromagnetik_v1') ?? '');
      return !raw.includes('Diperbarui dari perangkat 2');
    });
    await check('Komputer lab: siswa lain mendaftar di perangkat yang sama', () => register(p1, s2));
    await check('Komputer lab: siswa 2 tidak melihat jawaban siswa 1', async () => {
      await p1.getByRole('button', { name: 'MULAI PEMBELAJARAN' }).click();
      await goToScreen(p1, 'Pemantik');
      return (await p1.inputValue('#hypothesis-input')) === '';
    });
    await check('Data siswa 1 di server tetap utuh', async () =>
      (await serverHypothesis(s1.nis)).data.initialHypothesis === `${hyp2} + offline`);
    await goToScreen(p1, 'Cover');
    await signOutFromSidebar(p1);

    // ---------------------------------------------------------------- Impor dari mode latihan
    const d3 = await newPage(browser);
    const p3 = d3.page;
    const localHyp = `Jawaban mode latihan ${RUN}`;
    await check('Mode latihan: bisa dipakai tanpa akun', async () => {
      await p3.getByRole('button', { name: /Lanjut tanpa akun/ }).click();
      await p3.fill('input[placeholder="Contoh: Alya Putri Pratama"]', 'Nama Lokal');
      await p3.fill('input[placeholder="Contoh: XII MIPA 1"]', 'XII');
      await p3.fill('input[placeholder="Contoh: Kelompok 3"]', 'K1');
      await p3.fill('input[placeholder="Contoh: SMA Negeri 1 Nusantara"]', 'SMA');
      await p3.getByRole('button', { name: /MULAI PEMBELAJARAN SEKARANG/ }).click();
      await goToScreen(p3, 'Pemantik');
      await p3.fill('#hypothesis-input', localHyp);
      await p3.getByText('Tersimpan di perangkat').first().waitFor();
    });
    await check('Masuk dari mode latihan: jawaban lokal ditawarkan lalu dipindah ke akun', async () => {
      await goToScreen(p3, 'Cover');
      await p3.getByRole('button', { name: 'Masuk dengan akun siswa (NIS + PIN)' }).click();
      await login(p3, s2); // dialog konfirmasi impor diterima otomatis
      await waitSynced(p3);
      await p3.waitForTimeout(500);
      return (await serverHypothesis(s2.nis)).data.initialHypothesis === localHyp;
    });

    // ---------------------------------------------------------------- Wajib ganti PIN
    await admin.from('students').update({ must_change_pin: true }).eq('school_id', schoolId).eq('nis', s1.nis);
    const d4 = await newPage(browser);
    const p4 = d4.page;
    await check('PIN direset guru: siswa wajib membuat PIN baru', async () => {
      await login(p4, s1);
      await p4.getByRole('dialog', { name: 'Buat PIN Baru' }).waitFor({ timeout: 20000 });
      await p4.fill('#new-pin', '274910');
      await p4.fill('#confirm-pin', '274910');
      await p4.getByRole('button', { name: 'Simpan PIN Baru' }).click();
      await p4.getByText('PIN berhasil diganti').waitFor({ timeout: 15000 });
    });
    await check('Tombol "Lanjutkan" menutup dialog wajib ganti PIN', async () => {
      await p4.getByRole('button', { name: 'Lanjutkan' }).click();
      return (await p4.getByRole('dialog', { name: 'Buat PIN Baru' }).count()) === 0;
    });
    await check('Setelah dimuat ulang, dialog tidak muncul lagi', async () => {
      await p4.reload();
      await p4.waitForTimeout(3000);
      return (await p4.getByRole('dialog', { name: 'Buat PIN Baru' }).count()) === 0;
    });
    await check('PIN baru dipakai untuk masuk', async () => {
      const d6 = await newPage(browser);
      await login(d6.page, { nis: s1.nis, pin: '274910' });
      await d6.page.getByRole('heading', { name: 'Halo, Siswa Satu' }).waitFor({ timeout: 20000 })
        .catch(async () => d6.page.locator('#hypothesis-input').waitFor({ timeout: 5000 }));
      await d6.context.close();
    });

    await check('Tampilan mode gelap tetap terbaca di panel akun', async () => {
      const d5 = await newPage(browser);
      await d5.page.evaluate(() => localStorage.setItem('emodul_theme', 'dark'));
      await d5.page.reload();
      await d5.page.getByRole('heading', { name: 'Masuk ke Akun Siswa' }).waitFor();
      await d5.page.screenshot({ path: `${process.env.TEMP ?? '.'}/e2e-auth-dark.png`, fullPage: false });
      await d5.context.close();
    });
    await p4.screenshot({ path: `${process.env.TEMP ?? '.'}/e2e-signed-in.png` });
  } finally {
    await browser.close();
  }
}

async function cleanup() {
  if (!schoolId) return;
  const { data: students } = await admin.from('students').select('id').eq('school_id', schoolId);
  for (const s of students ?? []) await admin.auth.admin.deleteUser(s.id);
  await admin.from('schools').delete().eq('id', schoolId);
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
for (const f of failed) console.log(`  - ${f.name}  ${f.detail}`);
process.exit(fatal || failed.length ? 1 : 0);
