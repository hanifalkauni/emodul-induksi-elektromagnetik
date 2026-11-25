// Uji ujung-ke-ujung Fase 4 (foto, sketsa, laporan di Storage) dengan beberapa browser Edge.
// Butuh: dev server di http://localhost:5173 (atau E2E_BASE), kunci uji Turnstile, dan playwright-core.
//
//   set PW_CORE=%TEMP%\pw\node_modules\playwright-core\index.mjs
//   node --env-file=.env.local scripts/e2e-files.mjs
import { pathToFileURL } from 'node:url';
import { deflateSync } from 'node:zlib';
import { admin, guardNotProduction, listStorage, removeStoragePrefix } from './lib/admin-client.mjs';
guardNotProduction();
const { chromium } = await import(process.env.PW_CORE ? pathToFileURL(process.env.PW_CORE).href : 'playwright-core');
const BASE = process.env.E2E_BASE ?? 'http://localhost:5173';
const RUN = Date.now().toString(36).toUpperCase().slice(-6);
const LIVE_MS = 20000;
const results = [];
let schoolId = null;
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

// ---------------------------------------------------------------- PNG uji (besar, agar kompresi teruji)
const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function makePng(w, h, seed) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  let x = seed;
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let i = 0; i < w; i++) {
      x = (x * 1103515245 + 12345) & 0x7fffffff; // derau: membuat PNG besar dan JPEG perlu dikompres
      const o = y * (w * 3 + 1) + 1 + i * 3;
      raw[o] = (i + seed * 40) & 255;
      raw[o + 1] = (y + (x & 63)) & 255;
      raw[o + 2] = x & 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const photo1 = { name: 'proses-1.png', mimeType: 'image/png', buffer: makePng(2400, 1600, 1) };
const photo2 = { name: 'proses-2.png', mimeType: 'image/png', buffer: makePng(1600, 1200, 2) };
const photo3 = { name: 'prototipe.png', mimeType: 'image/png', buffer: makePng(1200, 900, 3) };
const pdf = { name: 'laporan.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% laporan uji\n%%EOF\n') };
const bigPdf = { name: 'besar.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(2 * 1024 * 1024 + 100, 32) };
const notImage = { name: 'bukan-foto.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('ini bukan gambar') };

// ---------------------------------------------------------------- bantuan browser
async function newPage(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'id-ID' });
  const page = await context.newPage();
  page.on('dialog', (d) => d.accept());
  page.on('pageerror', (e) => console.log('   [pageerror]', e.message));
  await page.goto(BASE);
  return { context, page };
}
async function submit(page, label) {
  await page.waitForFunction((t) => {
    const b = [...document.querySelectorAll('form button[type="submit"]')].find((x) => x.textContent.includes(t));
    return b && !b.disabled;
  }, label, { timeout: 30000 });
  await page.locator('form button[type="submit"]', { hasText: label }).click();
}
async function register(page, { classCode, nis, name, group, pin }) {
  await page.getByRole('tab', { name: 'Daftar Baru' }).click();
  await page.fill('#reg-class', classCode);
  await page.fill('#reg-nis', nis);
  await page.fill('#reg-name', name);
  await page.fill('#reg-group', group);
  await page.fill('#reg-pin', pin);
  await page.fill('#reg-pin2', pin);
  await submit(page, 'Daftar');
  await page.getByRole('heading', { name: `Halo, ${name}` }).waitFor({ timeout: 30000 });
  await page.getByRole('button', { name: 'MULAI PEMBELAJARAN' }).click();
}
const goTo = (page, shortTitle) => page.locator('aside nav button', { hasText: shortTitle }).first().click();
const storedImg = (page, alt) => page.locator(`img[alt="${alt}"][data-stored="true"]`);
const PROCESS_ALT = 'Foto proses perakitan prototipe';
const PROTO_ALT = 'Foto prototipe jadi';
const SKETCH_ALT = 'Pratinjau Sketsa Desain Generator';
// Kartu terdalam yang memuat judul itu (kartu luar layar juga memuat judul yang sama)
const card = (page, title) => page.locator('div.card', { has: page.getByRole('heading', { name: title }) }).last();
const groupOf = async (nis) => (await admin.from('students').select('group_id').eq('school_id', schoolId).eq('nis', nis).single()).data.group_id;
const filesOf = async (groupId, kind) => (await admin.from('files').select('storage_path, size_bytes, file_name').eq('group_id', groupId).eq('kind', kind)).data ?? [];
const groupData = async (groupId) => (await admin.from('group_state').select('data').eq('group_id', groupId).single()).data?.data ?? {};
async function waitFor(fn, timeout = LIVE_MS) {
  const end = Date.now() + timeout;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) return v;
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function main() {
  const { data: school, error } = await admin.from('schools').insert({ name: `UJI E2E FILES ${RUN}`, is_test: true }).select().single();
  if (error) throw error;
  schoolId = school.id;
  const { data: klass } = await admin.from('classes').insert({ school_id: school.id, name: 'XII FOTO' }).select().single();
  const sA = { classCode: klass.join_code, nis: `F1${RUN}`, name: 'Ani Foto', group: 'Kelompok A', pin: '583914' };
  const sB = { classCode: klass.join_code, nis: `F2${RUN}`, name: 'Budi Foto', group: 'Kelompok A', pin: '609172' };
  const sC = { classCode: klass.join_code, nis: `F3${RUN}`, name: 'Cici Foto', group: 'Kelompok B', pin: '715203' };
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const { page: pA } = await newPage(browser);
    const dB = await newPage(browser);
    const pB = dB.page;
    const { page: pC } = await newPage(browser);
    await register(pA, sA);
    await register(pB, sB);
    await register(pC, sC);
    const gA = await groupOf(sA.nis);
    const gC = await groupOf(sC.nis);
    for (const p of [pA, pB, pC]) await goTo(p, 'Prototipe');

    // ------------------------------------------------------------ foto proses
    await check('Foto proses dikompres lalu terunggah ke Storage kelompok', async () => {
      await pA.setInputFiles('input[aria-label="Unggah foto proses"]', photo1);
      await card(pA, 'Foto Proses').getByText('Tersimpan di kelompok').waitFor({ timeout: LIVE_MS });
      const rows = await filesOf(gA, 'process_photo');
      if (rows.length !== 1) return `!${rows.length} baris files`;
      return rows[0].size_bytes <= 300 * 1024 ? `${Math.round(rows[0].size_bytes / 1024)} KB dari PNG ${Math.round(photo1.buffer.length / 1024)} KB` : `!${rows[0].size_bytes} B`;
    });
    await check('group_state dan student_state tidak berisi base64', async () => {
      const has = await waitFor(async () => Boolean((await groupData(gA)).processPhotoFile?.path), 10000);
      if (!has) return '!referensi foto belum masuk group_state';
      const gs = JSON.stringify(await groupData(gA));
      const { data: st } = await admin.from('student_state').select('data').eq('student_id', (await admin.from('students').select('id').eq('nis', sA.nis).single()).data.id).single();
      const ss = JSON.stringify(st?.data ?? {});
      return !gs.includes('data:image') && !ss.includes('data:image') && gs.length < 20000 ? `group ${gs.length} B, siswa ${ss.length} B` : `!group ${gs.length} B, siswa ${ss.length} B`;
    });
    await check('Foto muncul di perangkat teman lewat signed URL', async () => {
      await storedImg(pB, PROCESS_ALT).waitFor({ timeout: LIVE_MS });
      const src = await storedImg(pB, PROCESS_ALT).getAttribute('src');
      const loaded = await pB.waitForFunction((alt) => {
        const img = document.querySelector(`img[alt="${alt}"][data-stored="true"]`);
        return img && img.complete && img.naturalWidth > 0 ? img.naturalWidth : 0;
      }, PROCESS_ALT, { timeout: LIVE_MS });
      const w = await loaded.jsonValue();
      return src.includes('/storage/v1/object/sign/') && w <= 1280 ? `lebar ${w}px` : `!${src.slice(0, 60)} lebar ${w}`;
    });
    await check('Siswa kelompok lain tidak melihat foto itu', async () => {
      await pC.waitForTimeout(1500);
      return (await pC.locator(`img[alt="${PROCESS_ALT}"]`).count()) === 0;
    });
    await check('Ganti foto: berkas lama dihapus dari Storage', async () => {
      const before = (await filesOf(gA, 'process_photo'))[0].storage_path;
      await pA.setInputFiles('input[aria-label="Unggah foto proses"]', photo2);
      const ok = await waitFor(async () => {
        const rows = await filesOf(gA, 'process_photo');
        return rows.length === 1 && rows[0].storage_path !== before;
      });
      if (!ok) return '!baris files tidak berganti';
      const objsNow = async () => (await listStorage(`${schoolId}/${klass.id}/${gA}`)).filter((p) => p.includes('/process_photo-'));
      await waitFor(async () => (await objsNow()).length === 1, 10000);
      const objs = await objsNow();
      return objs.length === 1 && !objs.includes(before) ? true : `!${objs.length} objek`;
    });
    await check('Format yang bukan gambar ditolak dengan pesan', async () => {
      await pA.setInputFiles('input[aria-label="Unggah foto prototipe"]', notImage);
      await card(pA, 'Foto Prototype').getByRole('alert').waitFor({ timeout: 10000 });
      return (await card(pA, 'Foto Prototype').getByRole('alert').textContent()).trim();
    });

    // ------------------------------------------------------------ offline
    await check('Offline: foto prototipe tampil di perangkat dan menunggu diunggah', async () => {
      await dB.context.setOffline(true);
      await pB.setInputFiles('input[aria-label="Unggah foto prototipe"]', photo3);
      await card(pB, 'Foto Prototype').getByText(/Menunggu koneksi|menunggu diunggah/).waitFor({ timeout: 10000 });
      const src = await pB.locator(`img[alt="${PROTO_ALT}"]`).getAttribute('src');
      await pA.waitForTimeout(2000);
      return src.startsWith('data:image/jpeg') && (await pA.locator(`img[alt="${PROTO_ALT}"]`).count()) === 0;
    });
    await check('Online kembali: foto prototipe terunggah dan muncul di perangkat Ani', async () => {
      await dB.context.setOffline(false);
      await card(pB, 'Foto Prototype').getByText('Tersimpan di kelompok').waitFor({ timeout: 45000 });
      await storedImg(pA, PROTO_ALT).waitFor({ timeout: LIVE_MS });
    });

    // ------------------------------------------------------------ sketsa kanvas
    await goTo(pA, 'Sketsa Desain');
    await goTo(pB, 'Sketsa Desain');
    await check('Sketsa di kanvas terunggah dan tampil di perangkat teman', async () => {
      const box = await pA.locator('canvas').boundingBox();
      await pA.mouse.move(box.x + 40, box.y + 40);
      await pA.mouse.down();
      for (let i = 1; i <= 12; i++) await pA.mouse.move(box.x + 40 + i * 25, box.y + 40 + (i % 2) * 60, { steps: 3 });
      await pA.mouse.up();
      await pA.getByText('Tersimpan di kelompok').waitFor({ timeout: LIVE_MS });
      await storedImg(pB, SKETCH_ALT).waitFor({ timeout: LIVE_MS });
      const rows = await filesOf(gA, 'design_sketch');
      return rows.length === 1 ? `${rows[0].size_bytes} B` : `!${rows.length} baris`;
    });
    await check('Bersihkan kanvas: sketsa hilang dari kelompok dan Storage', async () => {
      await pA.getByRole('button', { name: 'Bersihkan' }).click();
      await pB.locator(`img[alt="${SKETCH_ALT}"]`).waitFor({ state: 'detached', timeout: LIVE_MS });
      const gone = await waitFor(async () => (await filesOf(gA, 'design_sketch')).length === 0, 10000);
      return gone;
    });

    // ------------------------------------------------------------ laporan praktikum
    await goTo(pA, 'Learning Kit');
    await goTo(pB, 'Learning Kit');
    await check('Laporan PDF > 2 MB ditolak di browser', async () => {
      await pA.setInputFiles('input[aria-label="Pilih berkas laporan praktikum"]', bigPdf);
      await pA.getByRole('alert').filter({ hasText: '2 MB' }).waitFor({ timeout: 10000 });
    });
    await check('Laporan PDF terunggah; teman mendapat tautan untuk membukanya', async () => {
      await pA.setInputFiles('input[aria-label="Pilih berkas laporan praktikum"]', pdf);
      await pB.getByRole('link', { name: 'Buka berkas laporan' }).waitFor({ timeout: LIVE_MS });
      const href = await pB.getByRole('link', { name: 'Buka berkas laporan' }).getAttribute('href');
      const res = await fetch(href);
      const body = await res.text();
      return res.ok && body.startsWith('%PDF') ? true : `!${res.status}`;
    });

    // ------------------------------------------------------------ hapus
    await goTo(pA, 'Prototipe');
    await goTo(pB, 'Prototipe');
    await check('Hapus foto proses: hilang di perangkat teman dan dari Storage', async () => {
      await pA.getByRole('button', { name: 'Hapus foto proses' }).click();
      await pB.locator(`img[alt="${PROCESS_ALT}"]`).waitFor({ state: 'detached', timeout: LIVE_MS });
      const gone = await waitFor(async () => (await listStorage(`${schoolId}/${klass.id}/${gA}`)).every((p) => !p.includes('/process_photo-')), 10000);
      return gone && (await filesOf(gA, 'process_photo')).length === 0;
    });

    // ------------------------------------------------------------ data lama dari mode lokal
    const { page: pD } = await newPage(browser);
    await check('Mode lokal: foto tetap disimpan di perangkat (base64 terkompresi)', async () => {
      await pD.getByRole('button', { name: /Lanjut tanpa akun/ }).click();
      await pD.fill('input[placeholder="Contoh: Alya Putri Pratama"]', 'Cici Lokal');
      await pD.fill('input[placeholder="Contoh: XII MIPA 1"]', 'XII');
      await pD.fill('input[placeholder="Contoh: Kelompok 3"]', 'K');
      await pD.fill('input[placeholder="Contoh: SMA Negeri 1 Nusantara"]', 'SMA');
      await pD.getByRole('button', { name: /MULAI PEMBELAJARAN SEKARANG/ }).click();
      await goTo(pD, 'Prototipe');
      await pD.setInputFiles('input[aria-label="Unggah foto proses"]', photo1);
      await pD.locator(`img[alt="${PROCESS_ALT}"]`).waitFor({ timeout: 10000 });
      const src = await pD.locator(`img[alt="${PROCESS_ALT}"]`).getAttribute('src');
      return src.startsWith('data:image/jpeg') ? `${Math.round(src.length / 1024)} KB base64` : '!bukan base64';
    });
    await check('Masuk akun: foto lama dari perangkat diunggah ke kelompok (setelah konfirmasi)', async () => {
      await goTo(pD, 'Cover');
      await pD.getByRole('button', { name: 'Masuk dengan akun siswa (NIS + PIN)' }).click();
      await pD.fill('#login-nis', sC.nis);
      await pD.fill('#login-pin', sC.pin);
      await submit(pD, 'Masuk'); // dua konfirmasi (impor jawaban, unggah foto) diterima otomatis
      const ok = await waitFor(async () => (await filesOf(gC, 'process_photo')).length === 1, 40000);
      if (!ok) return '!tidak ada berkas di kelompok B';
      const local = await pD.evaluate(() => localStorage.getItem('emodul_induksi_elektromagnetik_v1') ?? '');
      return local.includes('data:image') ? '!base64 masih di perangkat' : true;
    });
    await check('Perangkat lain di kelompok B melihat foto hasil migrasi', async () => {
      await storedImg(pC, PROCESS_ALT).waitFor({ timeout: LIVE_MS });
    });
    await check('Kelompok A tidak ikut menerima foto kelompok B', async () =>
      (await filesOf(gA, 'process_photo')).length === 0 && (await pA.locator(`img[alt="${PROCESS_ALT}"]`).count()) === 0);
    await pB.screenshot({ path: `${process.env.TEMP ?? '.'}/e2e-files.png` });
  } finally {
    await browser.close();
  }
}
async function cleanup() {
  if (!schoolId) return;
  await removeStoragePrefix(schoolId);
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
