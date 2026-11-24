// Uji Fase 0: penerbitan sesi (D8) + RLS/hak akses per peran.
// Membuat sekolah uji sementara + akun uji, menjalankan pemeriksaan, lalu MENGHAPUS semuanya.
//
//   node --env-file=.env.local scripts/test-rls.mjs

import {
  admin, anonClient, userClient, createAuthUser, issueSession, syntheticStudentEmail, guardNotProduction,
} from './lib/admin-client.mjs';

guardNotProduction();

const RUN = Date.now().toString(36).toUpperCase();
const results = [];
const created = { users: [], schools: [], files: [] };

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'LULUS' : 'GAGAL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function expectRows(name, promise, expected) {
  const { data, error } = await promise;
  if (error) return record(name, false, `error: ${error.message}`);
  const n = Array.isArray(data) ? data.length : data ? 1 : 0;
  record(name, n === expected, `baris=${n}, harapan=${expected}`);
}

async function expectDenied(name, promise) {
  const { data, error } = await promise;
  const n = Array.isArray(data) ? data.length : data ? 1 : 0;
  // Ditolak = error hak akses/RLS, ATAU tidak ada baris yang terpengaruh/terlihat
  record(name, Boolean(error) || n === 0, error ? `ditolak: ${error.code ?? ''} ${error.message}` : `baris=${n}`);
}

async function expectOk(name, promise) {
  const { error } = await promise;
  record(name, !error, error ? `error: ${error.message}` : '');
}

// --- penyiapan -------------------------------------------------------------

async function makeSchool(label) {
  const { data, error } = await admin
    .from('schools').insert({ name: `UJI RLS ${label} ${RUN}`, is_test: true }).select().single();
  if (error) throw error;
  created.schools.push(data.id);
  return data;
}

async function makeClassGroups(schoolId, groupNames) {
  const { data: klass, error } = await admin
    .from('classes').insert({ school_id: schoolId, name: `Kelas ${RUN}` }).select().single();
  if (error) throw error;
  const groups = [];
  for (const name of groupNames) {
    const { data: g, error: gErr } = await admin.from('groups').insert({ class_id: klass.id, name }).select().single();
    if (gErr) throw gErr;
    groups.push(g);
  }
  return { klass, groups };
}

async function makeStudent(school, klass, group, nis, name) {
  const email = syntheticStudentEmail();
  const user = await createAuthUser(email);
  created.users.push(user.id);
  const { error } = await admin.from('students').insert({
    id: user.id, school_id: school.id, class_id: klass.id, group_id: group.id, nis, student_name: name,
  });
  if (error) throw error;
  const { error: secErr } = await admin.from('student_secrets').insert({
    student_id: user.id, pin_hash: 'uji-bukan-hash-nyata', pin_salt: 'uji',
  });
  if (secErr) throw secErr;
  const session = await issueSession(email);
  return { id: user.id, email, client: userClient(session.access_token), session };
}

async function makeStaff(role, schoolId, label) {
  const email = `uji-${label.toLowerCase()}-${RUN.toLowerCase()}@emodul.test`;
  const user = await createAuthUser(email);
  created.users.push(user.id);
  if (role) {
    const { error } = await admin.from('profiles').insert({
      user_id: user.id, role, status: 'active', school_id: schoolId, email,
    });
    if (error) throw error;
  }
  const session = await issueSession(email);
  return { id: user.id, client: userClient(session.access_token) };
}

// --- uji -------------------------------------------------------------------

async function run() {
  console.log(`Run ${RUN}: menyiapkan data uji...\n`);

  const schoolA = await makeSchool('A');
  const schoolB = await makeSchool('B');
  const { klass, groups: [g1, g2] } = await makeClassGroups(schoolA.id, ['Kelompok Satu', 'Kelompok Dua']);
  const { klass: klassB, groups: [gB] } = await makeClassGroups(schoolB.id, ['Kelompok B']);

  // D8: sesi diterbitkan lewat generateLink + verifyOtp
  let A;
  try {
    A = await makeStudent(schoolA, klass, g1, `A${RUN}`.slice(0, 20), 'Siswa A');
    record('D8: sesi siswa terbit (generateLink + verifyOtp)', true, `user ${A.id.slice(0, 8)}`);
  } catch (e) {
    record('D8: sesi siswa terbit (generateLink + verifyOtp)', false, e.message);
    throw new Error('Alur sesi D8 gagal; uji lain dihentikan. Pertimbangkan Opsi C (spec 3.4).');
  }
  const { data: me } = await A.client.auth.getUser(A.session.access_token);
  record('D8: token sesi dikenali sebagai user yang benar', me?.user?.id === A.id);

  const { data: refreshed, error: refreshErr } = await anonClient().auth.refreshSession({
    refresh_token: A.session.refresh_token,
  });
  record('D8: refresh token bekerja', !refreshErr && Boolean(refreshed?.session?.access_token),
    refreshErr?.message ?? '');

  const B = await makeStudent(schoolA, klass, g1, `B${RUN}`.slice(0, 20), 'Siswa B');
  const C = await makeStudent(schoolA, klass, g2, `C${RUN}`.slice(0, 20), 'Siswa C');
  const D = await makeStudent(schoolB, klassB, gB, `A${RUN}`.slice(0, 20), 'Siswa D (NIS sama, sekolah lain)');
  record('NIS sama di sekolah berbeda diizinkan', Boolean(D.id));

  const teacherA = await makeStaff('teacher', schoolA.id, 'GuruA');
  const teacherB = await makeStaff('teacher', schoolB.id, 'GuruB');
  const noProfile = await makeStaff(null, null, 'TanpaProfil');

  console.log('\n-- Data individu --');
  await expectOk('A menyimpan student_state miliknya',
    A.client.from('student_state').insert({ student_id: A.id, current_screen: 3, data: { initialHypothesis: 'uji' } }));
  await expectOk('C menyimpan student_state miliknya',
    C.client.from('student_state').insert({ student_id: C.id, data: { initialHypothesis: 'rahasia C' } }));
  await expectRows('A membaca student_state miliknya', A.client.from('student_state').select('*').eq('student_id', A.id), 1);
  await expectRows('A TIDAK bisa membaca student_state C', A.client.from('student_state').select('*').eq('student_id', C.id), 0);
  await expectDenied('A TIDAK bisa membuat student_state atas nama C',
    A.client.from('student_state').insert({ student_id: B.id, data: {} }).select());
  await expectDenied('A TIDAK bisa mengubah student_state C',
    A.client.from('student_state').update({ current_screen: 9 }).eq('student_id', C.id).select());
  await expectDenied('current_screen di luar 1..17 ditolak',
    A.client.from('student_state').update({ current_screen: 99 }).eq('student_id', A.id).select());

  console.log('\n-- Rahasia dan data akun --');
  await expectDenied('Siswa TIDAK bisa membaca student_secrets', A.client.from('student_secrets').select('*'));
  await expectDenied('Guru TIDAK bisa membaca student_secrets', teacherA.client.from('student_secrets').select('*'));
  await expectDenied('Siswa TIDAK bisa membaca teacher_invites', A.client.from('teacher_invites').select('*'));
  await expectDenied('Guru TIDAK bisa membaca teacher_invites', teacherA.client.from('teacher_invites').select('*'));
  await expectDenied('Siswa TIDAK bisa memindah kelompoknya sendiri',
    A.client.from('students').update({ group_id: g2.id }).eq('id', A.id).select());
  await expectDenied('Siswa TIDAK bisa membuka kunci akunnya sendiri',
    A.client.from('students').update({ locked_until: null }).eq('id', A.id).select());
  await expectDenied('Siswa TIDAK bisa menjadikan dirinya guru',
    A.client.from('profiles').insert({ user_id: A.id, role: 'admin', school_id: schoolA.id }).select());
  await expectRows('A hanya melihat baris students miliknya', A.client.from('students').select('id'), 1);

  console.log('\n-- Data kelompok --');
  await expectOk('A mengubah group_state kelompoknya (patch_group_state)',
    A.client.rpc('patch_group_state', { p_group: g1.id, p_patch: { experimentStrategy: 'tambah lilitan' } }));
  await expectDenied('A TIDAK bisa mengubah group_state kelompok lain',
    A.client.rpc('patch_group_state', { p_group: g2.id, p_patch: { experimentStrategy: 'sabotase' } }));
  {
    const { data, error } = await B.client.from('group_state').select('data, data_meta').eq('group_id', g1.id).single();
    record('B (satu kelompok) melihat perubahan A + data_meta tercatat',
      !error && data?.data?.experimentStrategy === 'tambah lilitan' && Boolean(data?.data_meta?.experimentStrategy),
      error?.message ?? '');
  }
  await expectRows('C (kelompok lain) TIDAK melihat group_state kelompok A',
    C.client.from('group_state').select('*').eq('group_id', g1.id), 0);

  const { data: idea, error: ideaErr } = await A.client.from('ideas').insert({
    group_id: g1.id, author_id: A.id, author_name: 'Siswa A', title: 'Ide uji', description: 'Deskripsi uji',
  }).select().single();
  record('A menambah ide di kelompoknya', !ideaErr, ideaErr?.message ?? '');
  await expectDenied('A TIDAK bisa menambah ide atas nama B',
    A.client.from('ideas').insert({ group_id: g1.id, author_id: B.id, author_name: 'B', title: 'x', description: 'x' }).select());
  await expectDenied('A TIDAK bisa menambah ide di kelompok lain',
    A.client.from('ideas').insert({ group_id: g2.id, author_id: A.id, author_name: 'A', title: 'x', description: 'x' }).select());
  await expectRows('B melihat ide A', B.client.from('ideas').select('id').eq('group_id', g1.id), 1);
  await expectRows('C TIDAK melihat ide kelompok A', C.client.from('ideas').select('id').eq('group_id', g1.id), 0);

  if (idea) {
    await expectOk('B memberi vote pada ide A', B.client.from('idea_votes').insert({ idea_id: idea.id, voter_id: B.id }));
    await expectDenied('B TIDAK bisa vote dua kali', B.client.from('idea_votes').insert({ idea_id: idea.id, voter_id: B.id }).select());
    await expectDenied('C TIDAK bisa vote ide kelompok lain', C.client.from('idea_votes').insert({ idea_id: idea.id, voter_id: C.id }).select());
    await expectDenied('B TIDAK bisa menghapus ide A',
      B.client.from('ideas').delete().eq('id', idea.id).select());
  }

  await expectOk('A menambah baris uji (test_trials)',
    A.client.from('test_trials').insert({ group_id: g1.id, trial_label: 'Uji 1', voltage: '1.2 V', led_lit: 'Ya' }));
  await expectRows('C TIDAK melihat baris uji kelompok A', C.client.from('test_trials').select('id').eq('group_id', g1.id), 0);
  await expectRows('v_group_members: A hanya melihat anggota kelompoknya (A, B)',
    A.client.from('v_group_members').select('student_id'), 2);
  {
    const { data } = await A.client.from('v_group_members').select('*').limit(1);
    record('v_group_members tidak membuka NIS', Boolean(data?.length) && !('nis' in data[0]));
  }

  console.log('\n-- Guru --');
  await expectRows('Guru sekolah A membaca student_state siswa A', teacherA.client.from('student_state').select('*').eq('student_id', A.id), 1);
  await expectRows('Guru sekolah A melihat siswa sekolahnya (A, B, C)', teacherA.client.from('students').select('id'), 3);
  await expectRows('Guru sekolah B TIDAK melihat student_state siswa A', teacherB.client.from('student_state').select('*').eq('student_id', A.id), 0);
  await expectRows('Guru sekolah B hanya melihat siswa sekolahnya (D)', teacherB.client.from('students').select('id'), 1);
  await expectDenied('Guru TIDAK bisa mengubah data jawaban siswa',
    teacherA.client.from('student_state').update({ current_screen: 1 }).eq('student_id', A.id).select());
  await expectDenied('Guru TIDAK bisa mengubah group_state',
    teacherA.client.rpc('patch_group_state', { p_group: g1.id, p_patch: { x: 1 } }));
  await expectOk('Guru sekolah A membuat kelas di sekolahnya',
    teacherA.client.from('classes').insert({ school_id: schoolA.id, teacher_id: teacherA.id, name: 'Kelas Guru A' }));
  await expectDenied('Guru sekolah A TIDAK bisa membuat kelas di sekolah B',
    teacherA.client.from('classes').insert({ school_id: schoolB.id, teacher_id: teacherA.id, name: 'Kelas Nyasar' }).select());
  await expectDenied('Guru TIDAK bisa mengubah perannya menjadi admin',
    teacherA.client.from('profiles').update({ role: 'admin' }).eq('user_id', teacherA.id).select());

  console.log('\n-- Akun tanpa profil dan pengunjung anonim --');
  await expectRows('Akun Google tanpa kode aktivasi tidak melihat siswa', noProfile.client.from('students').select('id'), 0);
  await expectRows('Akun tanpa profil tidak melihat student_state', noProfile.client.from('student_state').select('student_id'), 0);
  await expectRows('Akun tanpa profil tidak melihat kelas', noProfile.client.from('classes').select('id'), 0);
  const anon = anonClient();
  await expectDenied('Pengunjung anonim TIDAK bisa membaca sekolah', anon.from('schools').select('id'));
  await expectDenied('Pengunjung anonim TIDAK bisa membaca siswa', anon.from('students').select('id'));
  await expectDenied('Pengunjung anonim TIDAK bisa memanggil patch_group_state',
    anon.rpc('patch_group_state', { p_group: g1.id, p_patch: {} }));
  await expectDenied('Siswa TIDAK bisa memanggil ping()', A.client.rpc('ping'));
  await expectOk('service_role bisa memanggil ping()', admin.rpc('ping'));

  console.log('\n-- Storage --');
  const okPath = `${schoolA.id}/${klass.id}/${g1.id}/process_photo-${RUN}.png`;
  const png = new Blob([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' });
  {
    const { error } = await A.client.storage.from('emodul-uploads').upload(okPath, png, { contentType: 'image/png' });
    record('A mengunggah foto ke folder kelompoknya', !error, error?.message ?? '');
    if (!error) created.files.push(okPath);
  }
  {
    const badPath = `${schoolA.id}/${klass.id}/${g2.id}/process_photo-${RUN}.png`;
    const { error } = await A.client.storage.from('emodul-uploads').upload(badPath, png, { contentType: 'image/png' });
    record('A TIDAK bisa mengunggah ke folder kelompok lain', Boolean(error), error?.message ?? 'malah berhasil');
    if (!error) created.files.push(badPath);
  }
  {
    const forged = `${schoolB.id}/${klass.id}/${g1.id}/process_photo-x-${RUN}.png`;
    const { error } = await A.client.storage.from('emodul-uploads').upload(forged, png, { contentType: 'image/png' });
    record('A TIDAK bisa memalsukan segmen sekolah di path', Boolean(error), error?.message ?? 'malah berhasil');
    if (!error) created.files.push(forged);
  }
  {
    const { data } = await B.client.storage.from('emodul-uploads').download(okPath);
    record('B (satu kelompok) bisa mengunduh foto', Boolean(data));
  }
  {
    const { data } = await C.client.storage.from('emodul-uploads').download(okPath);
    record('C (kelompok lain) TIDAK bisa mengunduh foto', !data);
  }
  {
    const { data } = await teacherA.client.storage.from('emodul-uploads').download(okPath);
    record('Guru sekolah A bisa mengunduh foto', Boolean(data));
  }
  {
    const { data } = await teacherB.client.storage.from('emodul-uploads').download(okPath);
    record('Guru sekolah B TIDAK bisa mengunduh foto', !data);
  }
  {
    const txt = new Blob(['bukan gambar'], { type: 'text/plain' });
    const p = `${schoolA.id}/${klass.id}/${g1.id}/lab_report-${RUN}.txt`;
    const { error } = await A.client.storage.from('emodul-uploads').upload(p, txt, { contentType: 'text/plain' });
    record('Jenis berkas tidak diizinkan ditolak', Boolean(error), error?.message ?? 'malah berhasil');
    if (!error) created.files.push(p);
  }
}

async function cleanup() {
  if (created.files.length) await admin.storage.from('emodul-uploads').remove(created.files);
  for (const id of created.users) await admin.auth.admin.deleteUser(id);
  if (created.schools.length) await admin.from('schools').delete().in('id', created.schools);
}

let fatal = null;
try {
  await run();
} catch (e) {
  fatal = e;
  console.error(`\nBERHENTI: ${e.message ?? e}`);
} finally {
  await cleanup().catch((e) => console.error('Pembersihan gagal:', e.message ?? e));
}

const failed = results.filter((r) => !r.ok);
console.log(`\nHasil: ${results.length - failed.length}/${results.length} lulus. Data uji sudah dihapus.`);
if (failed.length) {
  console.log('Gagal:');
  for (const f of failed) console.log(`  - ${f.name}  ${f.detail}`);
}
process.exit(fatal || failed.length ? 1 : 0);
