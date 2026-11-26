// Uji browser Fase 5: dashboard guru (progres, jawaban, kelompok, CSV, kartu login, lonjakan pendaftaran)
// dan escape HTML di jendela cetak LKPD. Sesi guru uji dipasang langsung ke storage sesi staf
// (login Google tidak bisa diotomasi, sama seperti e2e-staff).
//
//   set PW_CORE=%TEMP%\pw\node_modules\playwright-core\index.mjs
//   node --env-file=.env.local scripts/e2e-dashboard.mjs     (E2E_BASE default http://localhost:5173)
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import {
  admin, createAuthUser, issueSession, syntheticStudentEmail, guardNotProduction, removeStoragePrefix,
} from './lib/admin-client.mjs';
guardNotProduction();
const { chromium } = await import(process.env.PW_CORE ? pathToFileURL(process.env.PW_CORE).href : 'playwright-core');
const BASE = process.env.E2E_BASE ?? 'http://localhost:5173';
const RUN = Date.now().toString(36).toUpperCase().slice(-6);
const XSS = '<img src=x onerror="window.__xss=1">';
const results = [];
const created = { users: [], schools: [] };
function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'LULUS' : 'GAGAL'}  ${name}${detail ? `  (${detail})` : ''}`);
}
async function check(name, fn) {
  try {
    const out = await fn();
    record(name, out !== false && !(typeof out === 'string' && out.startsWith('!')), typeof out === 'string' ? out.replace(/^!/, '') : '');
  } catch (e) {
    record(name, false, (e.message ?? String(e)).split('\n')[0].slice(0, 180));
  }
}

// PNG 1x1 yang valid (bucket mengizinkan image/png)
const JPEG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

async function seed() {
  const { data: school, error } = await admin.from('schools').insert({ name: `UJI DASHBOARD ${RUN}`, is_test: true }).select().single();
  if (error) throw error;
  created.schools.push(school.id);
  const { data: klass } = await admin.from('classes').insert({ school_id: school.id, name: `XII DASH ${RUN}` }).select().single();
  const { data: g1 } = await admin.from('groups').insert({ class_id: klass.id, name: 'Kelompok Faraday' }).select().single();
  const { data: g2 } = await admin.from('groups').insert({ class_id: klass.id, name: 'Kelompok Lenz' }).select().single();
  // 31 siswa dalam satu jam = lonjakan pendaftaran (> 30)
  const ids = [];
  for (let i = 0; i < 31; i++) {
    const user = await createAuthUser(syntheticStudentEmail());
    created.users.push(user.id);
    ids.push(user.id);
  }
  const names = ['Ani Dash', 'Budi Dash', ...Array.from({ length: 29 }, (_, i) => `Siswa ${String(i + 3).padStart(2, '0')}`)];
  const { error: sErr } = await admin.from('students').insert(ids.map((id, i) => ({
    id, school_id: school.id, class_id: klass.id, group_id: i < 2 ? g1.id : i < 4 ? g2.id : null,
    nis: `D${String(i).padStart(2, '0')}${RUN}`, student_name: names[i],
  })));
  if (sErr) throw sErr;
  const [ani, budi] = ids;
  await admin.from('student_state').insert([
    { student_id: ani, current_screen: 11, visited_screens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], completion_percent: 65,
      data: { initialHypothesis: `Hipotesis Ani ${XSS}`, guidingAnswers: { 0: 'Muncul arus' }, lenzAnswer: 'Arah berlawanan', creativityScores: { manyIdeas: 4 } } },
    { student_id: budi, current_screen: 17, visited_screens: [...Array(17).keys()].map((x) => x + 1), completion_percent: 100, data: {} },
  ]);
  for (const [author, title] of [[ani, 'Ide Ani 1'], [ani, 'Ide Ani 2'], [budi, 'Ide Budi 1']]) {
    await admin.from('ideas').insert({ id: randomUUID(), group_id: g1.id, author_id: author, author_name: 'x', title, description: 'Deskripsi ide' });
  }
  await admin.from('test_trials').update({ voltage: '2,4 V' }).eq('group_id', g1.id);
  const photoPath = `${school.id}/${klass.id}/${g1.id}/process_photo-${randomUUID()}.jpg`;
  const up = await admin.storage.from('emodul-uploads').upload(photoPath, JPEG, { contentType: 'image/png' });
  if (up.error) throw up.error;
  await admin.from('group_state').update({ data: {
    designName: `Gen-Flux ${XSS}`, designSuccessStatus: 'Sebagian', finalSelectedIdea: 'Rotor ganda',
    'presentationPoints.masalah': 'Listrik desa',
    processPhotoFile: { path: photoPath, name: 'proses.jpg', size: JPEG.length, uploadedAt: new Date().toISOString() },
    labReportLink: 'javascript:window.__xss=2',
  } }).eq('group_id', g1.id);
  // Guru sekolah ini
  const email = `uji-guru-dash-${RUN.toLowerCase()}@emodul.test`;
  const t = await createAuthUser(email);
  created.users.push(t.id);
  await admin.from('profiles').insert({ user_id: t.id, role: 'teacher', status: 'active', school_id: school.id, email });
  const session = await issueSession(email);
  return { school, klass, g1, session };
}

async function main() {
  const { school, klass, session } = await seed();
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'id-ID', acceptDownloads: true });
    const tp = await ctx.newPage();
    tp.on('dialog', (d) => d.accept());
    tp.on('pageerror', (e) => console.log('   [pageerror]', e.message));
    await tp.goto(`${BASE}/guru`);
    await tp.evaluate((s) => localStorage.setItem('emodul-staff-auth', JSON.stringify(s)), session);
    await tp.reload();

    await check('Dashboard kelas tampil dengan 31 siswa', async () => {
      await tp.getByRole('heading', { name: klass.name }).waitFor({ timeout: 20000 });
      await tp.locator('tbody tr[data-nis]').first().waitFor({ timeout: 15000 });
      const n = await tp.locator('tbody tr[data-nis]').count();
      return n === 31 ? true : `!${n} baris`;
    });
    await check('Peringatan lonjakan pendaftaran muncul (31 akun dalam 1 jam)', async () => {
      await tp.getByText('Lonjakan pendaftaran:').waitFor({ timeout: 5000 });
      return (await tp.getByText(/31 akun baru/).count()) === 1;
    });
    await check('Ringkasan: rata-rata progres dan siswa selesai', async () => {
      const dd = await tp.locator('dl dd').allTextContents();
      return dd[0] === '31' && dd[1] === `${Math.round(165 / 31)}%` && dd[2] === '1' ? dd.join(' | ') : `!${dd.join(' | ')}`;
    });
    await check('Baris Ani: progres 65% dan layar terakhir 11. Brainstorming', async () => {
      const row = tp.locator('tbody tr', { hasText: 'Ani Dash' });
      const t = await row.textContent();
      return t.includes('65%') && t.includes('11. Brainstorming') && t.includes('Kelompok Faraday') ? true : `!${t}`;
    });
    await check('Jawaban Ani tampil; isian berisi HTML ditampilkan sebagai teks', async () => {
      await tp.getByRole('button', { name: 'Lihat jawaban Ani Dash' }).click();
      const dlg = tp.getByRole('dialog', { name: 'Jawaban Ani Dash' });
      await dlg.getByText('Muncul arus').waitFor({ timeout: 10000 });
      const t = await dlg.textContent();
      const xss = await tp.evaluate(() => window.__xss);
      await dlg.getByRole('button', { name: 'Tutup' }).click();
      return t.includes(`Hipotesis Ani ${XSS}`) && t.includes('Arah berlawanan') && t.includes('Banyak ide: 4') && xss === undefined ? true : `!xss=${xss}`;
    });

    // ------------------------------------------------------------ kelompok
    await tp.getByRole('tab', { name: 'Kelompok' }).click();
    await check('Ringkasan kelompok: ide per anggota, baris uji, status desain, foto', async () => {
      const card = tp.getByRole('article', { name: 'Kelompok Kelompok Faraday' });
      await card.waitFor({ timeout: 10000 });
      const t = await card.textContent();
      const want = ['Ani Dash: 2', 'Budi Dash: 1', '3 ide', '1/1 baris uji terisi', 'Desain V1: Sebagian', 'Foto prosesada', 'Sketsabelum ada'];
      const miss = want.filter((w) => !t.includes(w));
      return miss.length ? `!kurang: ${miss.join(', ')}` : true;
    });
    await check('Peringatan siswa tanpa kelompok', async () => (await tp.getByText('27 siswa belum punya kelompok').count()) === 1);
    await check('Isian kelompok: desain, data uji, presentasi, dan foto dari Storage', async () => {
      await tp.getByRole('button', { name: 'Lihat isian kelompok Kelompok Faraday' }).click();
      const dlg = tp.getByRole('dialog', { name: 'Isian kelompok Kelompok Faraday' });
      await dlg.getByText('Rotor ganda').waitFor({ timeout: 10000 });
      await dlg.locator('img[data-stored="true"]').waitFor({ timeout: 15000 });
      const loaded = await dlg.locator('img[data-stored="true"]').evaluate((img) => new Promise((r) => (img.complete ? r(img.naturalWidth) : img.addEventListener('load', () => r(img.naturalWidth)))));
      const t = await dlg.textContent();
      return loaded > 0 && t.includes(`Gen-Flux ${XSS}`) && t.includes('2,4 V') && t.includes('Listrik desa') && t.includes('Ide Ani 1') ? true : `!lebar ${loaded}`;
    });
    await check('Tautan laporan javascript: tidak dijadikan link', async () => {
      const dlg = tp.getByRole('dialog', { name: 'Isian kelompok Kelompok Faraday' });
      const bad = await dlg.locator('a[href^="javascript"]').count();
      await dlg.getByRole('button', { name: 'Tutup' }).click();
      return bad === 0 && (await tp.evaluate(() => window.__xss)) === undefined;
    });

    // ------------------------------------------------------------ CSV
    const grab = async (label) => {
      const [dl] = await Promise.all([tp.waitForEvent('download', { timeout: 15000 }), tp.getByRole('button', { name: label }).click()]);
      return { name: dl.suggestedFilename(), body: await readFile(await dl.path(), 'utf8') };
    };
    await check('Unduh progres (CSV): semua siswa, pemisah titik koma', async () => {
      const { name, body } = await grab('Unduh progres (CSV)');
      const lines = body.replace('\uFEFF', '').trim().split('\r\n');
      const ani = lines.find((l) => l.includes('Ani Dash')) ?? '';
      return name.startsWith('progres-') && name.endsWith('.csv') && lines.length === 32 && ani.split(';').includes('65') ? name : `!${name} ${lines.length} baris`;
    });
    await check('Unduh jawaban (CSV): jawaban pribadi dan isian kelompok', async () => {
      const { name, body } = await grab('Unduh jawaban (CSV)');
      return body.includes('Muncul arus') && body.includes('Rotor ganda') && body.includes('Hipotesis awal') ? name : '!isi kurang';
    });

    // ------------------------------------------------------------ kartu login
    await check('Cetak kartu login: kode kelas dan Kode Sekolah, 8 kartu', async () => {
      const [pop] = await Promise.all([ctx.waitForEvent('page'), tp.getByRole('button', { name: 'Cetak kartu login' }).click()]);
      await pop.waitForLoadState();
      const t = await pop.textContent('body');
      const cards = await pop.locator('section.card').count();
      await pop.close();
      return t.includes(klass.join_code) && t.includes(school.school_code) && cards === 8 ? `${klass.join_code} / ${school.school_code}` : `!${cards} kartu`;
    });
    await check('Tab Kelola Siswa memuat tindakan siswa (Reset PIN)', async () => {
      await tp.getByRole('tab', { name: 'Kelola Siswa' }).click();
      await tp.getByRole('button', { name: 'Reset PIN' }).first().waitFor({ timeout: 10000 });
    });
    await tp.screenshot({ path: `${process.env.TEMP ?? '.'}/e2e-dashboard.png`, fullPage: false });

    // ------------------------------------------------------------ LKPD siswa: escape HTML
    const sp = await ctx.newPage();
    sp.on('dialog', (d) => d.accept());
    await sp.goto(BASE);
    await check('Cetak LKPD: nama peran berisi HTML tidak dijalankan', async () => {
      await sp.getByRole('button', { name: /Lanjut tanpa akun/ }).click();
      await sp.fill('input[placeholder="Contoh: Alya Putri Pratama"]', 'Uji LKPD');
      await sp.fill('input[placeholder="Contoh: XII MIPA 1"]', 'XII');
      await sp.fill('input[placeholder="Contoh: Kelompok 3"]', 'K');
      await sp.fill('input[placeholder="Contoh: SMA Negeri 1 Nusantara"]', 'SMA');
      await sp.getByRole('button', { name: /MULAI PEMBELAJARAN SEKARANG/ }).click();
      await sp.locator('aside nav button', { hasText: 'Learning Kit' }).first().click();
      await sp.fill('input[placeholder="Nama Leader..."]', XSS);
      const [pop] = await Promise.all([ctx.waitForEvent('page'), sp.getByRole('button', { name: /Unduh \/ Cetak LKPD/ }).click()]);
      await pop.waitForLoadState();
      await pop.waitForTimeout(500);
      const xss = await pop.evaluate(() => window.__xss);
      const imgs = await pop.locator('img[src="x"]').count();
      const shown = (await pop.textContent('body')).includes(XSS);
      await pop.close();
      return xss === undefined && imgs === 0 && shown ? true : `!xss=${xss} img=${imgs} teks=${shown}`;
    });
  } finally {
    await browser.close();
  }
}

async function cleanup() {
  for (const id of created.schools) await removeStoragePrefix(id).catch(() => {});
  for (const id of created.users) await admin.auth.admin.deleteUser(id);
  if (created.schools.length) await admin.from('schools').delete().in('id', created.schools);
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
