// Uji unit fungsi dashboard guru (src/staff/dashboardData.ts). Tanpa jaringan.
//   node scripts/test-dashboard.mjs
import {
  registrationSpike, csvCell, toCsv, progressCsv, answersCsv, safeHttpUrl, escapeHtml, studentStatus, screenLabel, presentationPoint,
} from '../src/staff/dashboardData.ts';
const results = [];
const ok = (name, cond, detail = '') => {
  results.push(cond);
  console.log(`${cond ? 'LULUS' : 'GAGAL'}  ${name}${detail ? `  (${detail})` : ''}`);
};
const NOW = Date.parse('2026-11-18T10:00:00Z');
const minutesAgo = (m) => new Date(NOW - m * 60_000).toISOString();

// --- lonjakan pendaftaran
ok('30 pendaftaran dalam 1 jam: belum dianggap lonjakan', registrationSpike(Array.from({ length: 30 }, (_, i) => minutesAgo(i)), { now: NOW }) === null);
const s31 = registrationSpike(Array.from({ length: 31 }, (_, i) => minutesAgo(i)), { now: NOW });
ok('31 pendaftaran dalam 1 jam: lonjakan', s31?.count === 31, JSON.stringify(s31));
ok('31 pendaftaran tersebar 2 jam: bukan lonjakan', registrationSpike(Array.from({ length: 31 }, (_, i) => minutesAgo(i * 4)), { now: NOW }) === null);
ok('Lonjakan lebih dari 24 jam lalu diabaikan', registrationSpike(Array.from({ length: 40 }, (_, i) => minutesAgo(26 * 60 + i)), { now: NOW }) === null);
const mixed = [...Array.from({ length: 35 }, (_, i) => minutesAgo(300 + i)), ...Array.from({ length: 5 }, (_, i) => minutesAgo(i))];
ok('Jendela terpadat dipilih (bukan jam terakhir)', registrationSpike(mixed, { now: NOW })?.count === 35);
ok('Tanggal tidak valid diabaikan', registrationSpike(['x', '', ...Array.from({ length: 31 }, (_, i) => minutesAgo(i))], { now: NOW })?.count === 31);

// --- CSV
ok('Sel berisi titik koma dan kutip dibungkus kutip', csvCell('a;b "c"') === '"a;b ""c"""');
ok('Sel berisi baris baru dibungkus kutip', csvCell('a\nb') === '"a\nb"');
ok('Rumus diawali = dinetralkan', csvCell('=HYPERLINK("x")').startsWith(`"'=`));
ok('Rumus diawali + - @ dinetralkan', ['+1', '-2+3', '@SUM(A1)'].every((v) => csvCell(v).replace(/^"/, '').startsWith("'")));
ok('Angka biasa tidak diubah', csvCell(42) === '42' && csvCell(null) === '');
const csv = toCsv(['A', 'B'], [[1, 'x']]);
ok('CSV diawali BOM, pemisah titik koma, baris CRLF', csv.startsWith('\uFEFFA;B\r\n1;x\r\n'));

const rows = [
  { student_id: 's1', class_id: 'c', group_id: 'g1', group_name: 'Kelompok A', nis: '1001', student_name: 'Ani', status: 'active', locked_until: null, must_change_pin: false,
    last_login_at: null, created_at: minutesAgo(10), completion_percent: 47, current_screen: 9, visited_count: 8, state_updated_at: null },
  { student_id: 's2', class_id: 'c', group_id: null, group_name: null, nis: '1002', student_name: 'Budi; "B"', status: 'active', locked_until: new Date(NOW + 600000).toISOString(), must_change_pin: false,
    last_login_at: null, created_at: minutesAgo(5), completion_percent: 0, current_screen: 1, visited_count: 0, state_updated_at: null },
];
const p = progressCsv(rows, 'XII 1', NOW).split('\r\n');
ok('CSV progres: satu baris per siswa + judul', p.length === 4 && p[3] === '');
ok('CSV progres: layar terakhir berlabel', p[1].includes('9. Learning Kit') && p[1].includes('47') && p[1].includes('8/17'));
ok('CSV progres: status terkunci tercatat', p[2].includes('Terkunci'));

const a = answersCsv(rows, 'XII 1',
  { s1: { initialHypothesis: 'Magnet bergerak', guidingAnswers: { 0: 'jawab 1', 4: 'jawab 5' }, creativityScores: { manyIdeas: 3, newSolution: 0 }, lenzAnswer: 'Lenz' } },
  { g1: { finalSelectedIdea: 'Ide final', designSuccessStatus: 'Sebagian' } });
const [head, r1, r2] = a.replace('\uFEFF', '').split('\r\n').map((l) => l.split(';'));
const col = (name) => head.indexOf(name);
ok('CSV jawaban: kolom hipotesis dan pemantik', r1[col('Hipotesis awal')] === 'Magnet bergerak' && r1[col('Pertanyaan pemantik 1')] === 'jawab 1' && r1[col('Pertanyaan pemantik 5')] === 'jawab 5');
ok('CSV jawaban: skor 0 dianggap kosong', r1[col('Kreativitas: Banyak ide')] === '3' && r1[col('Kreativitas: Solusi baru')] === '');
ok('CSV jawaban: isian kelompok ikut', r1[col('Kelompok: Ide final')] === 'Ide final' && r1[col('Kelompok: Berhasil (V1)')] === 'Sebagian');
ok('CSV jawaban: siswa tanpa kelompok/data tetap ada barisnya', Boolean(r2) && r2[col('Kelompok: Ide final')] === '');

// --- lain-lain
ok('safeHttpUrl menerima https', safeHttpUrl(' https://drive.google.com/x ') === 'https://drive.google.com/x');
ok('safeHttpUrl menolak javascript: dan data:', safeHttpUrl('javascript:alert(1)') === null && safeHttpUrl('data:text/html,x') === null && safeHttpUrl('bukan url') === null);
ok('escapeHtml menetralkan tag', escapeHtml('<img src=x onerror="a">') === '&lt;img src=x onerror=&quot;a&quot;&gt;');
ok('Status: nonaktif > terkunci > PIN baru > aktif',
  studentStatus({ status: 'disabled', locked_until: null, must_change_pin: true }, NOW).key === 'disabled' &&
  studentStatus({ status: 'active', locked_until: new Date(NOW + 1000).toISOString(), must_change_pin: true }, NOW).key === 'locked' &&
  studentStatus({ status: 'active', locked_until: new Date(NOW - 1000).toISOString(), must_change_pin: true }, NOW).key === 'pin' &&
  studentStatus({ status: 'active', locked_until: null, must_change_pin: false }, NOW).key === 'active');
ok('Label layar', screenLabel(17) === '17. Refleksi' && screenLabel(1) === '1. Cover');
ok('Poin presentasi dibaca dari kunci terpisah (Fase 3) dan bentuk lama', presentationPoint({ 'presentationPoints.masalah': 'baru' }, 'masalah') === 'baru' &&
  presentationPoint({ presentationPoints: { masalah: 'lama' } }, 'masalah') === 'lama');

const passed = results.filter(Boolean).length;
console.log(`Hasil: ${passed}/${results.length} lulus.`);
process.exit(passed === results.length ? 0 : 1);
