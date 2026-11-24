// Pindai tata letak ke-17 layar di beberapa lebar: halaman melebar, elemen keluar layar,
// wadah yang menggulung horizontal (konten terpotong), dan tumpang tindih di header.
//   PW_CORE=... node scripts/layout-scan.mjs <baseUrl> [theme]
import { pathToFileURL } from 'node:url';

const { chromium } = await import(pathToFileURL(process.env.PW_CORE).href);
const base = process.argv[2] ?? 'http://localhost:4173';
const theme = process.argv[3] ?? 'light';
const widths = [360, 390, 768, 1024, 1280, 1536, 1920];

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
const page = await ctx.newPage();
page.on('dialog', (d) => d.accept());
await page.goto(base);
await page.evaluate((theme) => {
  localStorage.setItem('emodul_mode', 'local');
  localStorage.setItem('emodul_theme', theme);
}, theme);
// Isi data contoh agar semua bagian (tabel, ide, dll.) tampil penuh
await page.reload();
await page.getByRole('button', { name: /Contoh Data/ }).click().catch(() => {});

let total = 0;
for (const w of widths) {
  await page.setViewportSize({ width: w, height: 900 });
  for (let screen = 1; screen <= 17; screen++) {
    await page.evaluate((screen) => {
      const raw = JSON.parse(localStorage.getItem('emodul_induksi_elektromagnetik_v1') || '{}');
      raw.currentScreen = screen;
      raw.visitedScreens = Array.from({ length: 17 }, (_, i) => i + 1);
      localStorage.setItem('emodul_induksi_elektromagnetik_v1', JSON.stringify(raw));
    }, screen);
    await page.reload();
    await page.waitForTimeout(350);
    const issues = await page.evaluate(() => {
      const out = [];
      const vw = document.documentElement.clientWidth;
      if (document.documentElement.scrollWidth > vw + 1) {
        // cari elemen paling luar yang keluar layar
        const offenders = [...document.querySelectorAll('main *, header *')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.right > vw + 1 && !el.closest('[class*="overflow-x-auto"]');
          })
          .slice(0, 3)
          .map((el) => `<${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 60)}">`);
        out.push(`halaman melebar ${document.documentElement.scrollWidth}>${vw}: ${offenders.join(' ')}`);
      }
      document.querySelectorAll('main [class*="overflow-x-auto"]').forEach((el) => {
        if (el.scrollWidth > el.clientWidth + 2) {
          out.push(`gulung-horizontal (${el.scrollWidth}>${el.clientWidth}): ${(el.textContent || '').trim().slice(0, 40)}`);
        }
      });
      const row = document.querySelector('header > div');
      const kids = [...row.children].filter((c) => c.getBoundingClientRect().width > 0 && getComputedStyle(c).display !== 'none');
      for (let i = 0; i < kids.length; i++) {
        for (let j = i + 1; j < kids.length; j++) {
          const a = kids[i].getBoundingClientRect(), b = kids[j].getBoundingClientRect();
          if (a.right > b.left + 1) out.push('header: blok bertumpuk');
        }
        // isi blok melewati batas bloknya sendiri
        const inner = [...kids[i].querySelectorAll('*')].some((el) => el.getBoundingClientRect().right > kids[i].getBoundingClientRect().right + 2);
        if (inner) out.push(`header: isi blok ${i} melewati batasnya`);
      }
      return [...new Set(out)];
    });
    if (issues.length) {
      total += issues.length;
      console.log(`${w}px  S${screen}: ${issues.join(' | ')}`);
    }
  }
}
await browser.close();
console.log(total ? `\n${total} masalah ditemukan` : 'Tidak ada masalah tata letak.');
