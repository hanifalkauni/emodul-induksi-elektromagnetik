// Fase 5: fungsi murni dashboard guru (tanpa React/jaringan, diuji di scripts/test-dashboard.mjs).

export interface ProgressRow {
  student_id: string;
  class_id: string | null;
  group_id: string | null;
  group_name: string | null;
  nis: string;
  student_name: string;
  status: 'active' | 'disabled';
  locked_until: string | null;
  must_change_pin: boolean;
  last_login_at: string | null;
  created_at: string;
  completion_percent: number;
  current_screen: number;
  visited_count: number;
  state_updated_at: string | null;
}

export interface GroupSummary {
  group_id: string;
  class_id: string;
  name: string;
  member_count: number;
  idea_count: number;
  ideas_per_member: { student_id: string; name: string; ideas: number }[];
  trial_count: number;
  filled_trial_count: number;
  design_status: 'Ya' | 'Sebagian' | 'Belum' | null;
  design_name: string | null;
  has_design_sketch: boolean;
  has_process_photo: boolean;
  has_prototype_photo: boolean;
  has_lab_report: boolean;
  state_updated_at: string | null;
}

export const MIN_IDEAS_PER_MEMBER = 2;

/** Judul singkat layar 1-17 (sama dengan navigasi siswa). */
export const SCREEN_TITLES = [
  'Cover', 'Petunjuk', 'Peta Belajar', 'Tujuan', 'Pemantik', 'Fluks Magnetik', 'Hukum Faraday', 'Hukum Lenz',
  'Learning Kit', 'Tantangan STEM', 'Brainstorming', 'Sketsa Desain', 'Prototipe', 'Testing', 'Improve', 'Presentasi', 'Refleksi',
];
export const screenLabel = (n: number) => `${n}. ${SCREEN_TITLES[n - 1] ?? '-'}`;

export const GUIDING_QUESTIONS = [
  'Apa yang terjadi ketika magnet digerakkan?',
  'Mengapa LED dapat menyala?',
  'Apakah magnet menghasilkan listrik?',
  'Apa yang terjadi jika magnet digerakkan lebih cepat?',
  'Bagaimana jika jumlah lilitan kumparan diperbanyak?',
];
export const CREATIVITY_ITEMS = [
  ['manyIdeas', 'Banyak ide'], ['differentIdeas', 'Ide berbeda'], ['developToDesign', 'Kembangkan desain'],
  ['improveAfterFail', 'Perbaiki setelah gagal'], ['newSolution', 'Solusi baru'],
] as const;
export const COLLABORATION_ITEMS = [
  ['contribute', 'Kontribusi'], ['listen', 'Mendengarkan'], ['respect', 'Menghargai'],
  ['helpSolve', 'Membantu'], ['responsible', 'Tanggung jawab'],
] as const;
/** Jawaban pribadi (student_state.data) yang ditampilkan dan diekspor. */
export const PERSONAL_ANSWERS = [
  ['initialHypothesis', 'Hipotesis awal'],
  ['fluxDefinitionAnswer', 'Definisi fluks magnetik'],
  ['faradayFactorAnswer', 'Analisis Hukum Faraday'],
  ['lenzAnswer', 'Analisis Hukum Lenz'],
  ['bestContributionText', 'Kontribusi terbaik'],
  ['futureImprovementText', 'Rencana perbaikan kerja kelompok'],
] as const;
/** Isian kelompok (group_state.data) yang ditampilkan dan diekspor. */
export const GROUP_ANSWERS = [
  ['experimentStrategy', 'Strategi percobaan'],
  ['finalSelectedIdea', 'Ide final'],
  ['designName', 'Nama desain'],
  ['designPhysicsPrinciple', 'Prinsip fisika'],
  ['designMaterials', 'Bahan'],
  ['designPrediction', 'Prediksi hasil'],
  ['designSuccessStatus', 'Berhasil (V1)'],
  ['failureCauseAnalysis', 'Penyebab kegagalan'],
  ['improveWeakness', 'Kelemahan'],
  ['improvePlannedChanges', 'Rencana perubahan V2'],
  ['improveV2Voltage', 'Tegangan V2'],
  ['improveV2LedStatus', 'LED V2 menyala'],
  ['testVideoLink', 'Tautan video uji'],
  ['presentationSlideLink', 'Tautan slide presentasi'],
] as const;
export const PRESENTATION_POINTS = [
  ['masalah', 'Masalah'], ['ideAwal', 'Ide awal'], ['konsepFisika', 'Konsep fisika'], ['desain', 'Desain'],
  ['prototype', 'Prototipe'], ['dataPengujian', 'Data pengujian'], ['kegagalan', 'Kegagalan'],
  ['perbaikan', 'Perbaikan'], ['hasilAkhir', 'Hasil akhir'],
] as const;

export type Dict = Record<string, unknown>;
export const text = (v: unknown): string => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v));
export const presentationPoint = (data: Dict, key: string): string =>
  text(data[`presentationPoints.${key}`]) || text((data.presentationPoints as Dict | undefined)?.[key]);

// ---------------------------------------------------------------------------
// Status siswa
// ---------------------------------------------------------------------------
export function studentStatus(r: Pick<ProgressRow, 'status' | 'locked_until' | 'must_change_pin'>, now = Date.now()) {
  if (r.status === 'disabled') return { key: 'disabled', text: 'Nonaktif' } as const;
  if (r.locked_until && new Date(r.locked_until).getTime() > now) {
    const t = new Date(r.locked_until).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return { key: 'locked', text: `Terkunci s.d. ${t}` } as const;
  }
  if (r.must_change_pin) return { key: 'pin', text: 'Menunggu PIN baru' } as const;
  return { key: 'active', text: 'Aktif' } as const;
}

// ---------------------------------------------------------------------------
// Lonjakan pendaftaran: lebih dari `threshold` pendaftaran dalam jendela 60 menit mana pun
// selama `lookbackMs` terakhir (spec Fase 5).
// ---------------------------------------------------------------------------
export function registrationSpike(
  createdAts: string[],
  opts: { now?: number; windowMs?: number; threshold?: number; lookbackMs?: number } = {},
): { count: number; from: string; to: string } | null {
  const now = opts.now ?? Date.now();
  const windowMs = opts.windowMs ?? 60 * 60 * 1000;
  const threshold = opts.threshold ?? 30;
  const lookbackMs = opts.lookbackMs ?? 24 * 60 * 60 * 1000;
  const times = createdAts
    .map((t) => new Date(t).getTime())
    .filter((t) => Number.isFinite(t) && t >= now - lookbackMs && t <= now + 60_000)
    .sort((a, b) => a - b);
  let best: { count: number; from: number; to: number } | null = null;
  let lo = 0;
  for (let hi = 0; hi < times.length; hi++) {
    while (times[hi] - times[lo] >= windowMs) lo++;
    const count = hi - lo + 1;
    if (!best || count > best.count) best = { count, from: times[lo], to: times[hi] };
  }
  if (!best || best.count <= threshold) return null;
  return { count: best.count, from: new Date(best.from).toISOString(), to: new Date(best.to).toISOString() };
}

// ---------------------------------------------------------------------------
// CSV: pemisah titik koma (Excel berbahasa Indonesia), BOM UTF-8, dan perlindungan formula
// (sel yang diawali = + - @ diberi tanda kutip satu agar tidak dijalankan sebagai rumus).
// ---------------------------------------------------------------------------
export const CSV_SEP = ';';
export function csvCell(v: unknown): string {
  let s = text(v).replace(/\r\n?/g, '\n');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export function toCsv(header: string[], rows: unknown[][]): string {
  return '\uFEFF' + [header, ...rows].map((r) => r.map(csvCell).join(CSV_SEP)).join('\r\n') + '\r\n';
}
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '');

export function progressCsv(rows: ProgressRow[], className: string, now = Date.now()): string {
  const header = ['Kelas', 'Nama', 'NIS', 'Kelompok', 'Progres (%)', 'Layar terakhir', 'Layar dikunjungi', 'Masuk terakhir', 'Terakhir menyimpan', 'Status', 'Terdaftar'];
  return toCsv(header, rows.map((r) => [
    className, r.student_name, r.nis, r.group_name ?? '', r.completion_percent, screenLabel(r.current_screen), `${r.visited_count}/17`,
    fmt(r.last_login_at), fmt(r.state_updated_at), studentStatus(r, now).text, fmt(r.created_at),
  ]));
}

export function answersCsv(
  rows: ProgressRow[],
  className: string,
  personal: Record<string, Dict>,
  group: Record<string, Dict>,
): string {
  const header = [
    'Kelas', 'Nama', 'NIS', 'Kelompok',
    ...PERSONAL_ANSWERS.slice(0, 1).map(([, l]) => l),
    ...GUIDING_QUESTIONS.map((_, i) => `Pertanyaan pemantik ${i + 1}`),
    ...PERSONAL_ANSWERS.slice(1).map(([, l]) => l),
    ...CREATIVITY_ITEMS.map(([, l]) => `Kreativitas: ${l}`),
    ...COLLABORATION_ITEMS.map(([, l]) => `Kolaborasi: ${l}`),
    ...GROUP_ANSWERS.map(([, l]) => `Kelompok: ${l}`),
  ];
  return toCsv(header, rows.map((r) => {
    const p = personal[r.student_id] ?? {};
    const g = (r.group_id && group[r.group_id]) || {};
    const guiding = (p.guidingAnswers as Dict | undefined) ?? {};
    const cs = (p.creativityScores as Dict | undefined) ?? {};
    const cl = (p.collaborationScores as Dict | undefined) ?? {};
    const score = (v: unknown) => (typeof v === 'number' && v > 0 ? v : '');
    return [
      className, r.student_name, r.nis, r.group_name ?? '',
      text(p.initialHypothesis),
      ...GUIDING_QUESTIONS.map((_, i) => text(guiding[i] ?? guiding[String(i)])),
      ...PERSONAL_ANSWERS.slice(1).map(([k]) => text(p[k])),
      ...CREATIVITY_ITEMS.map(([k]) => score(cs[k])),
      ...COLLABORATION_ITEMS.map(([k]) => score(cl[k])),
      ...GROUP_ANSWERS.map(([k]) => text(g[k])),
    ];
  }));
}

/** Tautan isian siswa hanya dipakai bila http(s); selain itu (mis. javascript:) dibuang. */
export function safeHttpUrl(v: unknown): string | null {
  try {
    const u = new URL(text(v).trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
  } catch {
    return null;
  }
}

/** Nama berkas aman: huruf/angka/tanda hubung saja. */
export const fileSlug = (s: string) => s.normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'kelas';

// ---------------------------------------------------------------------------
// HTML aman untuk jendela cetak (isian siswa tidak boleh menjadi HTML/skrip)
// ---------------------------------------------------------------------------
export const escapeHtml = (v: unknown) =>
  text(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
