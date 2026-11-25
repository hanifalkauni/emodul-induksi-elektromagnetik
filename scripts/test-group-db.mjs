// Uji Fase 3 di database: baris bawaan kelompok, sisipan ber-id dari klien, edit bersamaan, dan
// Realtime hanya sampai ke anggota kelompok (RLS). Membuat lalu menghapus data uji.
//   node --env-file=.env.local scripts/test-group-db.mjs
import {
  admin, realtimeUserClient, createAuthUser, issueSession, syntheticStudentEmail, guardNotProduction,
} from './lib/admin-client.mjs';

guardNotProduction();
const RUN = Date.now().toString(36).toUpperCase().slice(-6);
const results = [];
const created = { users: [], schools: [] };
const ok = (name, cond, detail = '') => {
  results.push(cond);
  console.log(`${cond ? 'LULUS' : 'GAGAL'}  ${name}${detail ? `  (${detail})` : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function student(schoolId, classId, groupId, nis) {
  const email = syntheticStudentEmail();
  const user = await createAuthUser(email);
  created.users.push(user.id);
  await admin.from('students').insert({ id: user.id, school_id: schoolId, class_id: classId, group_id: groupId, nis, student_name: nis });
  const s = await issueSession(email);
  const client = realtimeUserClient(s.access_token);
  return { id: user.id, client };
}

async function run() {
  const { data: school } = await admin.from('schools').insert({ name: `UJI GROUP ${RUN}`, is_test: true }).select().single();
  created.schools.push(school.id);
  const { data: klass } = await admin.from('classes').insert({ school_id: school.id, name: 'K' }).select().single();
  const { data: g1 } = await admin.from('groups').insert({ class_id: klass.id, name: 'G1' }).select().single();
  const { data: g2 } = await admin.from('groups').insert({ class_id: klass.id, name: 'G2' }).select().single();

  const { data: roles } = await admin.from('group_roles').select('role').eq('group_id', g1.id);
  const { data: trials } = await admin.from('test_trials').select('id').eq('group_id', g1.id);
  ok('Kelompok baru otomatis punya 5 peran dan 1 baris uji', roles.length === 5 && trials.length === 1, `${roles.length} peran, ${trials.length} baris`);

  const A = await student(school.id, klass.id, g1.id, `A${RUN}`);
  const B = await student(school.id, klass.id, g1.id, `B${RUN}`);
  const C = await student(school.id, klass.id, g2.id, `C${RUN}`);

  // Realtime: B (satu kelompok) dan C (kelompok lain) berlangganan ide kelompok G1
  const seen = { B: 0, C: 0 };
  const status = {};
  const sub = (who, s) => s.client.channel(`t-${who}-${RUN}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ideas', filter: `group_id=eq.${g1.id}` }, () => { seen[who]++; })
    .subscribe((st) => { status[who] = st; });
  const chB = sub('B', B);
  const chC = sub('C', C);
  for (let i = 0; i < 40 && !(status.B === 'SUBSCRIBED' && status.C === 'SUBSCRIBED'); i++) await sleep(250);
  ok('Realtime tersambung untuk siswa', status.B === 'SUBSCRIBED' && status.C === 'SUBSCRIBED', JSON.stringify(status));

  const ideaId = crypto.randomUUID();
  let r = await A.client.from('ideas').insert({ id: ideaId, group_id: g1.id, author_id: A.id, author_name: 'A', title: 'Ide A', description: 'd' });
  ok('Siswa bisa menyisipkan ide dengan id buatan klien', !r.error, r.error?.message ?? '');
  for (let i = 0; i < 40 && seen.B === 0; i++) await sleep(250);
  await sleep(1500);
  ok('Realtime: teman sekelompok menerima ide baru', seen.B === 1, `B=${seen.B}`);
  ok('Realtime: siswa kelompok lain TIDAK menerima apa pun', seen.C === 0, `C=${seen.C}`);
  await B.client.removeChannel(chB);
  await C.client.removeChannel(chC);

  const trialId = crypto.randomUUID();
  r = await A.client.from('test_trials').insert({ id: trialId, group_id: g1.id, sort_order: 1, trial_label: 'Uji 2', voltage: '1 V' });
  ok('Siswa bisa menyisipkan baris uji dengan id buatan klien', !r.error, r.error?.message ?? '');
  r = await C.client.from('test_trials').insert({ id: crypto.randomUUID(), group_id: g1.id, trial_label: 'Nyusup' }).select();
  ok('Siswa kelompok lain tidak bisa menyisipkan baris uji', Boolean(r.error) || !r.data?.length);
  r = await A.client.from('test_trials').insert({ id: trialId, group_id: g1.id, trial_label: 'Duplikat' });
  ok('Kirim ulang baris yang sama ditolak sebagai duplikat (aman dicoba ulang)', r.error?.code === '23505', r.error?.code ?? 'tidak ada galat');

  r = await A.client.from('group_roles').update({ member_name: 'Ani' }).eq('group_id', g1.id).eq('role', 'Leader').select();
  ok('Anggota mengisi nama peran', !r.error && r.data?.length === 1);
  r = await A.client.from('group_roles').update({ member_name: 'Iseng' }).eq('group_id', g2.id).eq('role', 'Leader').select();
  ok('Anggota tidak bisa mengubah peran kelompok lain', !r.data?.length);
  const { data: bRoles } = await B.client.from('group_roles').select('member_name').eq('group_id', g1.id).eq('role', 'Leader').single();
  ok('Teman sekelompok melihat nama peran', bRoles?.member_name === 'Ani');

  r = await B.client.from('ideas').delete().eq('id', ideaId).select();
  ok('Teman tidak bisa menghapus ide milik orang lain', !r.data?.length);

  await Promise.all([
    A.client.rpc('patch_group_state', { p_group: g1.id, p_patch: { experimentStrategy: 'dari A' } }),
    B.client.rpc('patch_group_state', { p_group: g1.id, p_patch: { finalSelectedIdea: 'dari B' } }),
  ]);
  const { data: gs } = await A.client.from('group_state').select('data, data_meta').eq('group_id', g1.id).single();
  ok('Dua anggota mengirim kolom berbeda bersamaan: keduanya tersimpan', gs.data.experimentStrategy === 'dari A' && gs.data.finalSelectedIdea === 'dari B');
  ok('Waktu ubah per kolom tercatat di data_meta', Boolean(gs.data_meta.experimentStrategy && gs.data_meta.finalSelectedIdea));
  r = await A.client.rpc('patch_group_state', { p_group: g1.id, p_patch: { besar: 'x'.repeat(70000) } });
  ok('Kiriman terlalu besar ditolak', Boolean(r.error));
}

async function cleanup() {
  for (const id of created.users) await admin.auth.admin.deleteUser(id).catch(() => {});
  if (created.schools.length) await admin.from('schools').delete().in('id', created.schools);
}

let fatal = null;
try { await run(); } catch (e) { fatal = e; console.error('BERHENTI:', e.message); } finally { await cleanup(); }
const failed = results.filter((x) => !x).length;
console.log(`\nHasil: ${results.length - failed}/${results.length} lulus. Data uji dihapus.`);
process.exit(fatal || failed ? 1 : 0);
