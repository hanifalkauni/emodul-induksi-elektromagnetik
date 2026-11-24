// Screenshot tata letak di beberapa lebar layar (mode latihan, data contoh) untuk memeriksa tumpang tindih.
//   PW_CORE=... node scripts/shots.mjs <baseUrl> <outDir> [screen=3] [theme=dark]
import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';

const { chromium } = await import(pathToFileURL(process.env.PW_CORE).href);
const base = process.argv[2] ?? 'http://localhost:4173';
const out = process.argv[3] ?? '.';
const screen = Number(process.argv[4] ?? 3);
const theme = process.argv[5] ?? 'dark';
mkdirSync(out, { recursive: true });

const widths = [390, 768, 1024, 1280, 1366, 1536, 1920];
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = [];
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(base);
  await page.evaluate(({ screen, theme }) => {
    localStorage.setItem('emodul_mode', 'local');
    localStorage.setItem('emodul_theme', theme);
    localStorage.setItem('emodul_induksi_elektromagnetik_v1', JSON.stringify({
      currentScreen: screen,
      visitedScreens: Array.from({ length: 17 }, (_, i) => i + 1),
      identity: { studentName: 'Alya Putri Pratama', studentClass: 'XII MIPA 2', groupName: 'Kelompok 3 (Faraday Squad)', schoolName: 'SMA Negeri 1 Nusantara' },
    }));
  }, { screen, theme });
  await page.reload();
  await page.waitForTimeout(1200);

  // Deteksi: elemen header yang saling bertabrakan, dan overflow horizontal halaman
  const issues = await page.evaluate(() => {
    const found = [];
    const header = document.querySelector('header');
    const boxes = [...header.querySelectorAll(':scope > div:first-child > *')]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter((b) => b.r.width > 0 && getComputedStyle(b.el).display !== 'none');
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i].r, b = boxes[j].r;
        if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom && b.top < a.bottom) found.push(`header: blok ${i} menimpa blok ${j}`);
      }
    const doc = document.documentElement;
    if (doc.scrollWidth > doc.clientWidth + 1) found.push(`halaman lebih lebar dari layar (${doc.scrollWidth} > ${doc.clientWidth})`);
    // teks terpotong di header
    header.querySelectorAll('.truncate').forEach((el) => {
      if (el.scrollWidth > el.clientWidth + 1) found.push(`terpotong: "${el.textContent.trim().slice(0, 30)}"`);
    });
    return found;
  });
  report.push(`${w}px: ${issues.length ? issues.join('; ') : 'ok'}`);
  await page.screenshot({ path: `${out}/w${w}.png` });
  await ctx.close();
}
await browser.close();
console.log(report.join('\n'));
