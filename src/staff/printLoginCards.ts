// Fase 5: kartu login siswa yang bisa dicetak (8 kartu per halaman A4, digunting dan dibagikan).
import { escapeHtml } from './dashboardData';

export function openLoginCards(p: { schoolName: string; schoolCode: string; className: string; classCode: string; siteUrl: string }): boolean {
  const win = window.open('', '_blank', 'width=900,height=900');
  if (!win) return false;
  const e = {
    school: escapeHtml(p.schoolName), schoolCode: escapeHtml(p.schoolCode), klass: escapeHtml(p.className),
    classCode: escapeHtml(p.classCode), site: escapeHtml(p.siteUrl.replace(/^https?:\/\//, '')),
  };
  const card = `
    <section class="card">
      <div class="top"><strong>E-Modul Induksi Elektromagnetik</strong><span>${e.school}</span></div>
      <div class="site">Buka: <b>${e.site}</b></div>
      <div class="codes">
        <div><small>Kode kelas (${e.klass})</small><b class="code">${e.classCode}</b></div>
        <div><small>Kode Sekolah</small><b class="code">${e.schoolCode}</b></div>
      </div>
      <ol>
        <li><b>Pertama kali:</b> pilih <b>Daftar Baru</b>, isi kode kelas, NIS, nama, kelompok, lalu buat PIN 6 angka.</li>
        <li><b>Berikutnya:</b> masuk dengan <b>NIS + PIN</b>. Kode Sekolah hanya diisi bila diminta.</li>
        <li>Jangan beri tahu PIN ke teman. Lupa PIN atau akun terkunci? Minta guru me-reset.</li>
      </ol>
    </section>`;
  win.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8">
<title>Kartu Login Siswa - ${e.klass}</title>
<style>
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 0; }
  .bar { padding: 12px; display: flex; gap: 8px; align-items: center; border-bottom: 1px solid #e2e8f0; }
  .bar button { font-size: 14px; padding: 8px 14px; border-radius: 8px; border: 1px solid #2563eb; background: #2563eb; color: #fff; cursor: pointer; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; padding: 6mm; }
  .card { border: 1.5px dashed #64748b; border-radius: 6px; padding: 4mm; font-size: 10.5px; line-height: 1.35; break-inside: avoid; height: 64mm; overflow: hidden; }
  .top { display: flex; justify-content: space-between; gap: 6px; font-size: 11px; border-bottom: 1px solid #cbd5e1; padding-bottom: 2mm; }
  .top span { color: #475569; text-align: right; }
  .site { margin: 2mm 0; }
  .codes { display: flex; gap: 3mm; }
  .codes div { flex: 1; border: 1px solid #cbd5e1; border-radius: 4px; padding: 1.5mm 2mm; }
  .codes small { display: block; color: #475569; font-size: 9px; }
  .code { font-family: 'Courier New', monospace; font-size: 18px; letter-spacing: 2px; }
  ol { margin: 2mm 0 0; padding-left: 4.5mm; }
  li { margin-bottom: 1mm; }
  @media print { .bar { display: none; } .grid { padding: 0; } }
</style></head><body>
<div class="bar"><button onclick="window.print()">Cetak</button><span>8 kartu per halaman. Gunting di garis putus-putus.</span></div>
<main class="grid">${card.repeat(8)}</main>
</body></html>`);
  win.document.close();
  return true;
}
