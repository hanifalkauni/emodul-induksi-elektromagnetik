import { EModulState } from '../types/emodul';

export function openPrintableLkpd(state: EModulState) {
  const win = window.open('', '_blank', 'width=900,height=900');
  if (!win) {
    alert('Mohon izinkan pop-up browser untuk mengunduh/mencetak LKPD.');
    return;
  }

  const rolesHtml = state.roles
    .map(
      (r) => `
      <tr>
        <td style="padding:8px;border:1px solid #cbd5e1;font-weight:600;">${r.role}</td>
        <td style="padding:8px;border:1px solid #cbd5e1;">${r.taskDescription}</td>
        <td style="padding:8px;border:1px solid #cbd5e1;">${r.memberName || '____________________'}</td>
      </tr>`
    )
    .join('');

  win.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <title>LKPD Praktikum - Induksi Elektromagnetik</title>
      <style>
        body { font-family: Arial, sans-serif; color: #0f172a; padding: 32px; line-height: 1.5; }
        h1, h2 { color: #0f172a; margin-bottom: 6px; }
        .header { border-bottom: 3px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f8fafc; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; }
        th { background: #e2e8f0; text-align: left; padding: 8px; border: 1px solid #cbd5e1; }
        .box { border: 1px solid #94a3b8; padding: 12px; min-height: 70px; border-radius: 6px; margin-bottom: 16px; background: #fff; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom:16px;">
        <button onclick="window.print()" style="padding:10px 18px;background:#0284c7;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">
          Cetak / Simpan sebagai PDF
        </button>
      </div>
      <div class="header">
        <h1>LEMBAR KERJA PESERTA DIDIK (LKPD)</h1>
        <p style="margin:0;color:#475569;">E-Modul Interaktif Fisika: Induksi Elektromagnetik — “Dari Gerak Magnet Menjadi Energi Listrik”</p>
      </div>

      <div class="meta">
        <div><strong>Nama Siswa:</strong> ${state.identity.studentName || '____________________'}</div>
        <div><strong>Kelas:</strong> ${state.identity.studentClass || '____________________'}</div>
        <div><strong>Kelompok:</strong> ${state.identity.groupName || '____________________'}</div>
        <div><strong>Sekolah:</strong> ${state.identity.schoolName || '____________________'}</div>
      </div>

      <h2>A. Tantangan Eksperimen Learning Kit</h2>
      <p><em>“Bagaimana menghasilkan GGL induksi sebesar mungkin?”</em></p>
      <p><strong>Alat & Bahan:</strong> Magnet, Kumparan, Kabel, LED, Multimeter, Papan Rangkaian.</p>

      <h2>B. Pembagian Peran Kelompok</h2>
      <table>
        <thead>
          <tr><th>Peran</th><th>Tugas</th><th>Nama Anggota</th></tr>
        </thead>
        <tbody>${rolesHtml}</tbody>
      </table>

      <h2>C. Hipotesis Awal & Strategi Kelompok</h2>
      <div class="box">${state.initialHypothesis || 'Tuliskan hipotesis awal kelompok Anda di sini...'}</div>
      <div class="box">${state.experimentStrategy || 'Tuliskan strategi eksperimen untuk memaksimalkan GGL induksi...'}</div>

      <h2>D. Tabel Pengamatan Data Praktikum</h2>
      <table>
        <thead>
          <tr><th>No</th><th>Jumlah Lilitan (N)</th><th>Kecepatan Gerak Magnet</th><th>Kekuatan/Jenis Magnet</th><th>Tegangan Multimeter (V)</th><th>Nyala LED</th></tr>
        </thead>
        <tbody>
          <tr><td style="padding:12px;border:1px solid #cbd5e1;">1</td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;">Lambat</td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td></tr>
          <tr><td style="padding:12px;border:1px solid #cbd5e1;">2</td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;">Cepat</td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td></tr>
          <tr><td style="padding:12px;border:1px solid #cbd5e1;">3</td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;">Sangat Cepat</td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td></tr>
        </tbody>
      </table>

      <h2>E. Kesimpulan Eksperimen</h2>
      <div class="box"></div>
    </body>
    </html>
  `);
  win.document.close();
}

export function openPrintablePortfolio(state: EModulState) {
  const win = window.open('', '_blank', 'width=960,height=900');
  if (!win) {
    alert('Mohon izinkan pop-up browser untuk mencetak portofolio belajar.');
    return;
  }

  const testingHtml = state.testingRows
    .map(
      (row) => `
      <tr>
        <td style="padding:6px;border:1px solid #cbd5e1;">${row.trialLabel}</td>
        <td style="padding:6px;border:1px solid #cbd5e1;">${row.voltage || '-'}</td>
        <td style="padding:6px;border:1px solid #cbd5e1;">${row.turns || '-'}</td>
        <td style="padding:6px;border:1px solid #cbd5e1;">${row.speed || '-'}</td>
        <td style="padding:6px;border:1px solid #cbd5e1;">${row.magnetCondition || '-'}</td>
        <td style="padding:6px;border:1px solid #cbd5e1;">${row.ledLit}</td>
      </tr>`
    )
    .join('');

  win.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <title>Portofolio Pembelajaran STEM - ${state.identity.studentName || 'Siswa'}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #0f172a; padding: 32px; line-height: 1.5; }
        h1, h2, h3 { color: #0f172a; }
        .section { margin-bottom: 20px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background: #f1f5f9; padding: 6px; border: 1px solid #cbd5e1; text-align: left; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom:16px;">
        <button onclick="window.print()" style="padding:10px 18px;background:#059669;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">
          Cetak / Simpan Portofolio PDF
        </button>
      </div>
      <h1>PORTOFOLIO E-MODUL INDUKSI ELEKTROMAGNETIK</h1>
      <p><strong>Siswa:</strong> ${state.identity.studentName || '-'} | <strong>Kelas:</strong> ${state.identity.studentClass || '-'} | <strong>Kelompok:</strong> ${state.identity.groupName || '-'} | <strong>Sekolah:</strong> ${state.identity.schoolName || '-'}</p>

      <div class="section">
        <h3>1. Pemahaman Konsep Fisika</h3>
        <p><strong>Hipotesis Awal:</strong> ${state.initialHypothesis || '-'}</p>
        <p><strong>Definisi Fluks Magnetik:</strong> ${state.fluxDefinitionAnswer || '-'}</p>
        <p><strong>Analisis Faktor GGL Faraday:</strong> ${state.faradayFactorAnswer || '-'}</p>
        <p><strong>Analisis Arah Arus Hukum Lenz:</strong> ${state.lenzAnswer || '-'}</p>
      </div>

      <div class="section">
        <h3>2. Desain Generator Mini STEM</h3>
        <p><strong>Nama Desain:</strong> ${state.designName || '-'}</p>
        <p><strong>Ide Final Kelompok:</strong> ${state.finalSelectedIdea || '-'}</p>
        <p><strong>Prinsip Fisika:</strong> ${state.designPhysicsPrinciple || '-'}</p>
        <p><strong>Bahan:</strong> ${state.designMaterials || '-'}</p>
        <p><strong>Prediksi Hasil:</strong> ${state.designPrediction || '-'}</p>
      </div>

      <div class="section">
        <h3>3. Data Pengujian & Iterasi Perbaikan (V1 &rarr; V2)</h3>
        <table>
          <thead><tr><th>Uji</th><th>Tegangan</th><th>Lilitan</th><th>Kecepatan</th><th>Magnet</th><th>LED</th></tr></thead>
          <tbody>${testingHtml}</tbody>
        </table>
        <p><strong>Status Keberhasilan V1:</strong> ${state.designSuccessStatus || '-'} | <strong>Penyebab:</strong> ${state.failureCauseAnalysis || '-'}</p>
        <p><strong>Kelemahan & Perbaikan V2:</strong> ${state.improveWeakness || '-'} &rarr; ${state.improvePlannedChanges || '-'}</p>
        <p><strong>Hasil Tegangan V2:</strong> ${state.improveV2Voltage || '-'} | <strong>LED V2:</strong> ${state.improveV2LedStatus || '-'}</p>
      </div>

      <div class="section">
        <h3>4. Refleksi Diri & Kolaborasi</h3>
        <p><strong>Skor Kreativitas (1-4):</strong> Banyak Ide=${state.creativityScores.manyIdeas}, Ide Berbeda=${state.creativityScores.differentIdeas}, Kembangkan Desain=${state.creativityScores.developToDesign}, Perbaiki Setelah Gagal=${state.creativityScores.improveAfterFail}, Solusi Baru=${state.creativityScores.newSolution}</p>
        <p><strong>Skor Kolaborasi (1-4):</strong> Kontribusi=${state.collaborationScores.contribute}, Mendengarkan=${state.collaborationScores.listen}, Menghargai=${state.collaborationScores.respect}, Membantu=${state.collaborationScores.helpSolve}, Tanggung Jawab=${state.collaborationScores.responsible}</p>
        <p><strong>Kontribusi Terbaik:</strong> ${state.bestContributionText || '-'}</p>
        <p><strong>Rencana Perbaikan Kerja Kelompok:</strong> ${state.futureImprovementText || '-'}</p>
      </div>
    </body>
    </html>
  `);
  win.document.close();
}

