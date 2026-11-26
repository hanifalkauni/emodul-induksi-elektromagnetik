// Uji Fase 5 di database: isi view v_class_progress dan v_group_summary, serta batas akses (RLS lewat
// security_invoker): guru hanya melihat sekolahnya, siswa hanya dirinya/kelompoknya, anon ditolak.
//   node --env-file=.env.local scripts/test-dashboard-db.mjs
import { randomUUID } from 'node:crypto';
import {
  admin, anonClient, realtimeUserClient, createAuthUser, issueSession, syntheticStudentEmail, guardNotProduction,
} from './lib/admin-client.mjs';
guardNotProduction();
const RUN = Date.now().toString(36).toUpperCase().slice(-6);
const results = [];
const created = { users: [], schools: [] };
const ok = (name, cond, detail = '') => {
  results.push(cond);
  console.log(`${cond ? 'LULUS' : 'GAGAL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

async function student(schoolId, classId, groupId, nis, name) {
  const email = syntheticStudentEmail();
  const user = await createAuthUser(email);
  created.users.push(user.id);
  const { error } = await admin.from('students').insert({ id: user.id, school_id: schoolId, class_id: classId, group_id: groupId, nis, student_name: name });
  if (error) throw error;
  const s = await issueSession(email);
  return { id: user.id, client: realtimeUserClient(s.access_token) };
}
async function teacher(schoolId) {
  const email = `guru-${RUN.toLowerCase()}-${randomUUID().slice(0, 6)}@emodul.test`;
  const user = await createAuthUser(email);
  created.users.push(user.id);
  const { error } = await admin.from('profiles').insert({ user_id: user.id, role: 'teacher', status: 'active', school_id: schoolId, email });
  if (error) throw error;
  const s = await issueSession(email);
  return { id: user.id, client: realtimeUserClient(s.access_token) };
}

async function run() {
  const mk = async (name) => {
    const { data, error } = await admin.from('schools').insert({ name: `${name} ${RUN}`, is_test: true }).select().single();
    if (error) throw error;
    created.schools.push(data.id);
    return data;
  };
  const school = await mk('UJI DASH');
  const other = await mk('UJI DASH LAIN');
  const { data: klass } = await admin.from('classes').insert({ school_id: school.id, name: 'K' }).select().single();
  const { data: g1 } = await admin.from('groups').insert({ class_id: klass.id, name: 'G1' }).select().single();
  const { data: g2 } = await admin.from('groups').insert({ class_id: klass.id, name: 'G2' }).select().single();
  const A = await student(school.id, klass.id, g1.id, `A${RUN}`, 'Ani');
  const B = await student(school.id, klass.id, g1.id, `B${RUN}`, 'Budi');
  const C = await student(school.id, klass.id, g2.id, `C${RUN}`, 'Cici');
  const T = await teacher(school.id);
  const T2 = await teacher(other.id);

  await A.client.from('student_state').insert({ student_id: A.id, current_screen: 11, visited_screens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], completion_percent: 65, data: { initialHypothesis: 'h' } });
  for (const [who, n] of [[A, 2], [B, 1]]) {
    for (let i = 0; i < n; i++) {
      const r = await who.client.from('ideas').insert({ id: randomUUID(), group_id: g1.id, author_id: who.id, author_name: 'x', title: `Ide ${i}`, description: 'd' });
      if (r.error) throw r.error;
    }
  }
  await A.client.from('test_trials').update({ voltage: '1,2 V' }).eq('group_id', g1.id);
  await A.client.from('test_trials').insert({ id: randomUUID(), group_id: g1.id, sort_order: 1, trial_label: 'Uji 2' });
  await A.client.rpc('patch_group_state', { p_group: g1.id, p_patch: {
    designSuccessStatus: 'Sebagian', designName: 'Gen-Flux',
    processPhotoFile: { path: `${school.id}/${klass.id}/${g1.id}/process_photo-x.jpg`, name: 'a.jpg', size: 1, uploadedAt: new Date().toISOString() },
    designSketchFile: null,
  } });

  // ---------------------------------------------------------------- v_class_progress
  let r = await T.client.from('v_class_progress').select('*').eq('class_id', klass.id).order('student_name');
  ok('Guru melihat semua siswa kelasnya di v_class_progress', !r.error && r.data.length === 3, r.error?.message ?? `${r.data?.length} baris`);
  const ani = r.data?.find((x) => x.student_id === A.id);
  ok('Progres, layar terakhir, dan jumlah layar dari student_state', ani?.completion_percent === 65 && ani?.current_screen === 11 && ani?.visited_count === 11 && ani?.group_name === 'G1');
  const budi = r.data?.find((x) => x.student_id === B.id);
  ok('Siswa tanpa student_state tampil dengan progres 0 dan layar 1', budi?.completion_percent === 0 && budi?.current_screen === 1 && budi?.state_updated_at === null);
  r = await T2.client.from('v_class_progress').select('student_id').eq('class_id', klass.id);
  ok('Guru sekolah lain TIDAK melihat siswa sekolah ini', !r.error && r.data.length === 0);
  r = await A.client.from('v_class_progress').select('student_id');
  ok('Siswa hanya melihat barisnya sendiri', !r.error && r.data.length === 1 && r.data[0].student_id === A.id);
  r = await anonClient().from('v_class_progress').select('student_id');
  ok('Pengunjung tanpa login ditolak', Boolean(r.error) || r.data.length === 0);

  // ---------------------------------------------------------------- v_group_summary
  r = await T.client.from('v_group_summary').select('*').eq('class_id', klass.id).order('name');
  ok('Guru melihat ringkasan semua kelompok kelasnya', !r.error && r.data.length === 2, r.error?.message ?? '');
  const s1 = r.data?.find((x) => x.group_id === g1.id);
  const per = Object.fromEntries((s1?.ideas_per_member ?? []).map((m) => [m.name, m.ideas]));
  ok('Jumlah ide per anggota', s1?.idea_count === 3 && per.Ani === 2 && per.Budi === 1 && s1?.member_count === 2, JSON.stringify(per));
  ok('Jumlah baris uji dan yang sudah terisi tegangan', s1?.trial_count === 2 && s1?.filled_trial_count === 1, `${s1?.filled_trial_count}/${s1?.trial_count}`);
  ok('Status dan nama desain dari group_state', s1?.design_status === 'Sebagian' && s1?.design_name === 'Gen-Flux');
  ok('Ada/tidaknya foto dibaca dari referensi group_state (null = belum ada)', s1?.has_process_photo === true && s1?.has_design_sketch === false && s1?.has_prototype_photo === false);
  const s2 = r.data?.find((x) => x.group_id === g2.id);
  ok('Kelompok kosong: hitungan 0, tanpa status desain', s2?.idea_count === 0 && s2?.design_status === null && s2?.member_count === 1);
  r = await T2.client.from('v_group_summary').select('group_id').eq('class_id', klass.id);
  ok('Guru sekolah lain TIDAK melihat ringkasan kelompok', !r.error && r.data.length === 0);
  r = await C.client.from('v_group_summary').select('group_id');
  ok('Siswa hanya melihat ringkasan kelompoknya sendiri', !r.error && r.data.length === 1 && r.data[0].group_id === g2.id);

  // ---------------------------------------------------------------- data rinci untuk guru
  r = await T.client.from('student_state').select('data').eq('student_id', A.id).maybeSingle();
  ok('Guru bisa membaca jawaban pribadi siswanya', r.data?.data?.initialHypothesis === 'h');
  r = await T2.client.from('student_state').select('data').eq('student_id', A.id).maybeSingle();
  ok('Guru sekolah lain tidak bisa membaca jawaban', !r.data);
  r = await T.client.from('students').select('id, student_state(data)').eq('class_id', klass.id);
  ok('Ekspor jawaban: siswa + student_state dalam satu kueri', !r.error && r.data.length === 3, r.error?.message ?? '');
  r = await T.client.rpc('patch_group_state', { p_group: g1.id, p_patch: { designName: 'diubah guru' } });
  ok('Guru tidak bisa mengubah isian kelompok (hanya baca)', Boolean(r.error));
}

async function cleanup() {
  for (const id of created.users) await admin.auth.admin.deleteUser(id);
  if (created.schools.length) await admin.from('schools').delete().in('id', created.schools);
}
let fatal = null;
try {
  await run();
} catch (e) {
  fatal = e;
  console.error('BERHENTI:', e.message);
} finally {
  await cleanup();
}
const passed = results.filter(Boolean).length;
console.log(`Hasil: ${passed}/${results.length} lulus. Data uji dihapus.`);
process.exit(fatal || passed !== results.length ? 1 : 0);
