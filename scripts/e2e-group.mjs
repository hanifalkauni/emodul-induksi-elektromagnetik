// Uji ujung-ke-ujung Fase 3 (data kelompok bersama + Realtime) di dua browser sungguhan.
// Butuh: dev server di http://localhost:5173 (atau E2E_BASE), kunci uji Turnstile, dan playwright-core.
//
//   set PW_CORE=%TEMP%\pw\node_modules\playwright-core\index.mjs
//   node --env-file=.env.local scripts/e2e-group.mjs
import { pathToFileURL } from 'node:url';
import { admin, guardNotProduction } from './lib/admin-client.mjs';
guardNotProduction();
const { chromium } = await import(process.env.PW_CORE ? pathToFileURL(process.env.PW_CORE).href : 'playwright-core');
const BASE = process.env.E2E_BASE ?? 'http://localhost:5173';
const RUN = Date.now().toString(36).toUpperCase().slice(-6);
const LIVE_MS = 15000; // Realtime biasanya < 2 detik; polling cadangan 10 detik
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
async function register(page, { classCode, nis, name, group, pin }) {
  await page.getByRole('tab', { name: 'Daftar Baru' }).click();
  await page.fill('#reg-class', classCode);
  await page.fill('#reg-nis', nis);
  await page.fill('#reg-name', name);
  await page.fill('#reg-group', group);
  await page.fill('#reg-pin', pin);
  await page.fill('#reg-pin2', pin);
  await page.waitForFunction(() => {
    const b = [...document.querySelectorAll('form button[type="submit"]')].find((x) => x.textContent.includes('Daftar'));
    return b && !b.disabled;
  }, null, { timeout: 30000 });
  await page.locator('form button[type="submit"]', { hasText: 'Daftar' }).click();
  await page.getByRole('heading', { name: `Halo, ${name}` }).waitFor({ timeout: 30000 });
  await page.getByRole('button', { name: 'MULAI PEMBELAJARAN' }).click();
}
const goTo = (page, shortTitle) => page.locator('aside nav button', { hasText: shortTitle }).first().click();
const waitValue = (page, selector, value, timeout = LIVE_MS) =>
  page.waitForFunction(([s, v]) => document.querySelector(s)?.value === v, [selector, value], { timeout });
const roleInput = (page, role) => page.locator(`input[placeholder="Nama ${role}..."]`);
const studentId = async (nis) =>
  (await admin.from('students').select('id, group_id').eq('school_id', schoolId).eq('nis', nis).single()).data;

async function main() {
  const { data: school, error } = await admin.from('schools').insert({ name: `UJI E2E GROUP ${RUN}`, is_test: true }).select().single();
  if (error) throw error;
  schoolId = school.id;
  const { data: klass } = await admin.from('classes').insert({ school_id: school.id, name: 'XII GRUP' }).select().single();
  const s1 = { classCode: klass.join_code, nis: `G1${RUN}`, name: 'Ani Satu', group: 'Kelompok A', pin: '583914' };
  const s2 = { classCode: klass.join_code, nis: `G2${RUN}`, name: 'Budi Dua', group: 'Kelompok A', pin: '609172' };
  const s3 = { classCode: klass.join_code, nis: `G3${RUN}`, name: 'Cici Tiga', group: 'Kelompok B', pin: '715203' };
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const { page: p1 } = await newPage(browser);
    const d2 = await newPage(browser);
    const p2 = d2.page;
    const { page: p3 } = await newPage(browser);
    await check('Tiga siswa mendaftar (dua di Kelompok A, satu di Kelompok B)', async () => {
      await register(p1, s1);
      await register(p2, s2);
      await register(p3, s3);
      const [a, b, c] = await Promise.all([studentId(s1.nis), studentId(s2.nis), studentId(s3.nis)]);
      return a.group_id === b.group_id && a.group_id !== c.group_id;
    });
    for (const p of [p1, p2, p3]) await goTo(p, 'Brainstorming');
    await check('Papan ide tersambung langsung (Realtime) di kedua perangkat', async () => {
      for (const p of [p1, p2]) await p.getByText('Papan tersambung langsung').waitFor({ timeout: 20000 });
    });
    await check('Badge "Dibagikan dengan" tampil di layar kelompok', async () => {
      await p1.getByText(/Dibagikan dengan/).first().waitFor({ timeout: 10000 });
    });

    // ------------------------------------------------------------ Ide + vote
    const ideaA = `Generator Ani ${RUN}`;
    await p1.fill('input[placeholder="Nama Pengusul..."]', 'Ani');
    await p1.fill('input[placeholder^="Judul Ide Desain"]', ideaA);
    await p1.fill('textarea[placeholder^="Jelaskan cara kerja"]', 'Magnet berputar di dalam kumparan.');
    await p1.getByRole('button', { name: 'Tempelkan Ide' }).click();
    await check('Ide dari Ani muncul di perangkat Budi tanpa dimuat ulang', async () => {
      await p2.getByRole('heading', { name: ideaA }).waitFor({ timeout: LIVE_MS });
    });
    await check('Budi tidak diberi tombol hapus untuk ide milik Ani', async () =>
      (await p2.getByRole('button', { name: `Hapus ide ${ideaA}` }).count()) === 0);
    await check('Ani tetap bisa menghapus idenya sendiri (tombol ada)', async () =>
      (await p1.getByRole('button', { name: `Hapus ide ${ideaA}` }).count()) === 1);
    await check('Vote dari Budi terlihat di perangkat Ani', async () => {
      await p2.getByRole('button', { name: `Vote ${ideaA}` }).click();
      await p2.getByRole('button', { name: `Tarik vote untuk ${ideaA}` }).waitFor({ timeout: 5000 });
      await p1.waitForFunction((t) => {
        const b = [...document.querySelectorAll('button')].find((x) => x.getAttribute('aria-label') === `Vote ${t}`);
        return b?.textContent.trim() === '1';
      }, ideaA, { timeout: LIVE_MS });
    });
    await check('Vote berupa toggle: klik lagi menarik vote', async () => {
      await p2.getByRole('button', { name: `Tarik vote untuk ${ideaA}` }).click();
      await p1.waitForFunction((t) => {
        const b = [...document.querySelectorAll('button')].find((x) => x.getAttribute('aria-label') === `Vote ${t}`);
        return b?.textContent.trim() === '0';
      }, ideaA, { timeout: LIVE_MS });
    });
    await check('Siswa kelompok lain tidak melihat ide Kelompok A', async () => {
      await p3.waitForTimeout(2000);
      return (await p3.getByRole('heading', { name: ideaA }).count()) === 0;
    });

    // ------------------------------------------------------------ Teks kelompok: kolom berbeda tidak saling timpa
    const final1 = `Ide final dari Ani ${RUN}`;
    const strat2 = `Strategi dari Budi ${RUN}`;
    await goTo(p2, 'Learning Kit');
    await Promise.all([
      p1.fill('#final-idea', final1),
      p2.fill('textarea[placeholder^="Tuliskan strategi kelompokmu"]', strat2),
    ]);
    await check('Ani dan Budi mengisi kolom berbeda bersamaan: keduanya bertahan di kedua perangkat', async () => {
      await waitValue(p2, 'textarea[placeholder^="Tuliskan strategi kelompokmu"]', strat2, 3000);
      await goTo(p1, 'Learning Kit');
      await waitValue(p1, 'textarea[placeholder^="Tuliskan strategi kelompokmu"]', strat2);
      await goTo(p2, 'Brainstorming');
      await waitValue(p2, '#final-idea', final1);
      await goTo(p1, 'Brainstorming');
      await waitValue(p1, '#final-idea', final1, 3000);
    });

    // ------------------------------------------------------------ Peran
    await goTo(p1, 'Learning Kit');
    await goTo(p2, 'Learning Kit');
    await Promise.all([roleInput(p1, 'Leader').fill('Ani'), roleInput(p2, 'Engineer').fill('Budi')]);
    await check('Peran yang diisi dua anggota bersamaan tersimpan keduanya', async () => {
      await p1.waitForFunction(() => document.querySelector('input[placeholder="Nama Engineer..."]')?.value === 'Budi', null, { timeout: LIVE_MS });
      await p2.waitForFunction(() => document.querySelector('input[placeholder="Nama Leader..."]')?.value === 'Ani', null, { timeout: LIVE_MS });
      await p1.waitForTimeout(2500);
      return (await roleInput(p1, 'Leader').inputValue()) === 'Ani' && (await roleInput(p2, 'Engineer').inputValue()) === 'Budi';
    });

    // ------------------------------------------------------------ Baris uji
    await goTo(p1, 'Testing');
    await goTo(p2, 'Testing');
    const rows = (p) => p.locator('button[aria-label="Hapus baris uji"]').count();
    const before = await rows(p2);
    await check('Baris uji baru dari Ani muncul di perangkat Budi', async () => {
      await p1.getByRole('button', { name: 'Tambah Baris Uji' }).click();
      await p2.waitForFunction((n) => document.querySelectorAll('button[aria-label="Hapus baris uji"]').length === n + 1, before, { timeout: LIVE_MS });
    });
    await check('Budi mengisi tegangan di baris itu, Ani melihatnya', async () => {
      await p2.locator('input[placeholder="Contoh: 1.8 V"]').last().fill('2,4 V');
      await p1.waitForFunction(() => {
        const all = [...document.querySelectorAll('input[placeholder="Contoh: 1.8 V"]')];
        return all.at(-1)?.value === '2,4 V';
      }, null, { timeout: LIVE_MS });
    });

    // ------------------------------------------------------------ Offline
    await goTo(p1, 'Brainstorming');
    await goTo(p2, 'Brainstorming');
    const ideaOff = `Ide offline Budi ${RUN}`;
    await check('Budi offline menambah ide: tersimpan di perangkat', async () => {
      await d2.context.setOffline(true);
      await p2.fill('input[placeholder^="Judul Ide Desain"]', ideaOff);
      await p2.fill('textarea[placeholder^="Jelaskan cara kerja"]', 'Dicatat saat offline.');
      await p2.getByRole('button', { name: 'Tempelkan Ide' }).click();
      await p2.getByRole('heading', { name: ideaOff }).waitFor({ timeout: 5000 });
      await p1.waitForTimeout(3000);
      return (await p1.getByRole('heading', { name: ideaOff }).count()) === 0;
    });
    await check('Budi online kembali: ide offline terkirim dan muncul di perangkat Ani', async () => {
      await d2.context.setOffline(false);
      await p1.getByRole('heading', { name: ideaOff }).waitFor({ timeout: 30000 });
    });

    // ------------------------------------------------------------ Pindah kelompok
    await check('Budi dipindah guru ke Kelompok B: setelah dimuat ulang tidak melihat data Kelompok A', async () => {
      const c = await studentId(s3.nis);
      const b = await studentId(s2.nis);
      const { error: e } = await admin.from('students').update({ group_id: c.group_id }).eq('id', b.id);
      if (e) throw e;
      await p2.reload();
      await goTo(p2, 'Brainstorming');
      await p2.getByText('Papan tersambung langsung').waitFor({ timeout: 20000 });
      await p2.waitForTimeout(1500);
      const leaked = (await p2.getByRole('heading', { name: ideaA }).count()) + (await p2.getByRole('heading', { name: ideaOff }).count());
      const finalIdea = await p2.inputValue('#final-idea');
      return leaked === 0 && finalIdea !== final1 ? true : `bocor: ${leaked} ide, final="${finalIdea}"`;
    });
    await check('Data Kelompok A di server tetap utuh setelah Budi pindah', async () => {
      const a = await studentId(s1.nis);
      const { data } = await admin.from('ideas').select('title').eq('group_id', a.group_id);
      const titles = (data ?? []).map((x) => x.title);
      return titles.includes(ideaA) && titles.includes(ideaOff) ? true : JSON.stringify(titles);
    });
    await p1.screenshot({ path: `${process.env.TEMP ?? '.'}/e2e-group.png` });
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
