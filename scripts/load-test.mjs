// Uji beban kecil (Fase 6): N siswa mendaftar, masuk, menyimpan jawaban, dan mengisi data kelompok BERSAMAAN.
// Handler /api dijalankan di proses ini (IP dipalsukan lewat x-forwarded-for agar batas laju per IP tidak
// tercampur), database dan Auth memakai project Supabase sungguhan. Data uji dihapus setelahnya.
//
//   node --env-file=.env.local scripts/load-test.mjs [N=30]
//
// Catatan: hash PIN (scrypt) berjalan di laptop ini untuk semua siswa sekaligus, sedangkan di Vercel tersebar
// ke beberapa instance. Waktu daftar/masuk di sini cenderung lebih lambat dari production.
import { randomUUID } from 'node:crypto';
import { handle } from '../api/index.js';
import { admin, realtimeUserClient, guardNotProduction } from './lib/admin-client.mjs';
guardNotProduction();
const N = Math.max(2, Math.min(100, Number(process.argv[2]) || 30));
const GROUP_SIZE = 5;
const CAPTCHA = 'XXXX.DUMMY.TOKEN.XXXX';
const RUN = Date.now().toString(36).toUpperCase().slice(-6);
const userIds = [];
let schoolId = null;

async function call(route, body, i) {
  const res = await handle(new Request(`http://localhost/api?route=${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `203.0.113.${(i % 250) + 1}` },
    body: JSON.stringify(body),
  }));
  return { status: res.status, body: await res.json() };
}
async function timed(fn) {
  const t = performance.now();
  try {
    const out = await fn();
    return { ms: performance.now() - t, ok: out !== false, out };
  } catch (e) {
    return { ms: performance.now() - t, ok: false, err: String(e?.message ?? e).slice(0, 120) };
  }
}
const pct = (arr, p) => {
  const s = [...arr].sort((a, b) => a - b);
  return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]) : 0;
};
function report(name, rs) {
  const okN = rs.filter((r) => r.ok).length;
  const ms = rs.map((r) => r.ms);
  console.log(`${okN === rs.length ? 'LULUS' : 'GAGAL'}  ${name}: ${okN}/${rs.length} berhasil, p50 ${pct(ms, 50)} ms, p95 ${pct(ms, 95)} ms, maks ${pct(ms, 100)} ms`);
  const errs = [...new Set(rs.filter((r) => !r.ok).map((r) => r.err ?? JSON.stringify(r.out)))].slice(0, 3);
  for (const e of errs) console.log(`        galat: ${e}`);
  return okN === rs.length;
}

async function main() {
  const { data: school, error } = await admin.from('schools').insert({ name: `UJI BEBAN ${RUN}`, is_test: true }).select().single();
  if (error) throw error;
  schoolId = school.id;
  const { data: klass } = await admin.from('classes').insert({ school_id: school.id, name: 'XII BEBAN' }).select().single();
  const students = Array.from({ length: N }, (_, i) => ({ i, nis: `L${String(i).padStart(3, '0')}${RUN}`, pin: '583914', group: `Kelompok ${Math.floor(i / GROUP_SIZE) + 1}` }));
  console.log(`Uji beban: ${N} siswa, ${Math.ceil(N / GROUP_SIZE)} kelompok, semua bersamaan.\n`);
  const all = [];

  const reg = await Promise.all(students.map((s) => timed(async () => {
    const r = await call('auth/register', { classCode: klass.join_code, nis: s.nis, name: `Siswa ${s.i}`, groupName: s.group, pin: s.pin, pinConfirm: s.pin, captchaToken: CAPTCHA }, s.i);
    if (r.body.student?.id) userIds.push(r.body.student.id);
    return r.status === 201 || { status: r.status, error: r.body.error };
  })));
  all.push(report('Daftar', reg.map((r) => ({ ...r, ok: r.out === true }))));

  const login = await Promise.all(students.map((s) => timed(async () => {
    const r = await call('auth/login', { nis: s.nis, pin: s.pin, captchaToken: CAPTCHA }, s.i + 1000);
    if (r.status !== 200) return { status: r.status, error: r.body.error };
    s.id = r.body.student.id;
    s.groupId = r.body.student.groupId;
    s.client = realtimeUserClient(r.body.session.access_token);
    return true;
  })));
  all.push(report('Masuk', login.map((r) => ({ ...r, ok: r.out === true }))));

  const ready = students.filter((s) => s.client);
  const save = await Promise.all(ready.map((s) => timed(async () => {
    // Jalur yang sama dengan aplikasi (ModulContext): update dulu, insert bila belum ada baris
    const payload = { current_screen: 9, visited_screens: [1, 2, 3, 4, 5, 6, 7, 8, 9], completion_percent: 53, data: { initialHypothesis: `Hipotesis ${s.i}`.repeat(20) } };
    let { data, error: e } = await s.client.from('student_state').update(payload).eq('student_id', s.id).select('updated_at').maybeSingle();
    if (!e && !data) ({ data, error: e } = await s.client.from('student_state').insert({ student_id: s.id, ...payload }).select('updated_at').single());
    if (e || !data) throw e ?? new Error('tidak tersimpan');
  })));
  all.push(report('Simpan jawaban pribadi', save));

  const group = await Promise.all(ready.map((s) => timed(async () => {
    const r1 = await s.client.rpc('patch_group_state', { p_group: s.groupId, p_patch: { [`presentationPoints.p${s.i % GROUP_SIZE}`]: `Poin dari ${s.i}` } });
    if (r1.error) throw r1.error;
    const r2 = await s.client.from('ideas').insert({ id: randomUUID(), group_id: s.groupId, author_id: s.id, author_name: `S${s.i}`, title: `Ide ${s.i}`, description: 'd' });
    if (r2.error) throw r2.error;
  })));
  all.push(report('Isian kelompok + ide (bersamaan per kelompok)', group));

  // Tidak ada kiriman yang hilang: tiap kelompok punya semua poin dan ide anggotanya
  const groups = [...new Set(ready.map((s) => s.groupId))];
  let lost = 0;
  for (const g of groups) {
    const members = ready.filter((s) => s.groupId === g);
    const { data: gs } = await admin.from('group_state').select('data').eq('group_id', g).single();
    const { count } = await admin.from('ideas').select('id', { count: 'exact', head: true }).eq('group_id', g);
    lost += members.filter((s) => !gs.data[`presentationPoints.p${s.i % GROUP_SIZE}`]).length + (members.length - (count ?? 0));
  }
  console.log(`${lost === 0 ? 'LULUS' : 'GAGAL'}  Tidak ada kiriman yang saling menimpa atau hilang (${groups.length} kelompok, ${lost} hilang)`);
  all.push(lost === 0);
  return all.every(Boolean);
}

let passed = false;
try {
  passed = await main();
} catch (e) {
  console.error('BERHENTI:', e.message);
} finally {
  for (const id of userIds) await admin.auth.admin.deleteUser(id).catch(() => {});
  if (schoolId) await admin.from('schools').delete().eq('id', schoolId);
  console.log('\nData uji dihapus.');
}
process.exit(passed ? 0 : 1);
