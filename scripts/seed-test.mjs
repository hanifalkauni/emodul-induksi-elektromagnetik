// Seed data uji (spec 10, Fase 0; D24): satu sekolah is_test + satu kelas + satu kelompok.
// Tidak membuat akun admin/guru/siswa. Idempotent: aman dijalankan berulang.
//
//   node --env-file=.env.local scripts/seed-test.mjs

import { admin, guardNotProduction } from './lib/admin-client.mjs';

guardNotProduction();

const SCHOOL_NAME = 'SEKOLAH UJI - HAPUS';

async function main() {
  let { data: school, error } = await admin
    .from('schools').select('*').eq('name', SCHOOL_NAME).eq('is_test', true).maybeSingle();
  if (error) throw error;

  if (!school) {
    ({ data: school, error } = await admin
      .from('schools').insert({ name: SCHOOL_NAME, city: 'Kota Uji', is_test: true }).select().single());
    if (error) throw error;
    console.log('Sekolah uji dibuat.');
  } else {
    console.log('Sekolah uji sudah ada.');
  }

  let { data: klass, error: classErr } = await admin
    .from('classes').select('*').eq('school_id', school.id).eq('name', 'XII MIPA UJI').maybeSingle();
  if (classErr) throw classErr;
  if (!klass) {
    ({ data: klass, error: classErr } = await admin
      .from('classes').insert({ school_id: school.id, name: 'XII MIPA UJI' }).select().single());
    if (classErr) throw classErr;
  }

  const { data: group, error: groupErr } = await admin
    .from('groups').upsert({ class_id: klass.id, name: 'Kelompok 1' }, { onConflict: 'class_id,name_key' })
    .select().single();
  if (groupErr) throw groupErr;

  console.log('\nData uji:');
  console.log(`  Sekolah : ${school.name} (Kode Sekolah ${school.school_code})`);
  console.log(`  Kelas   : ${klass.name} (Kode Kelas ${klass.join_code})`);
  console.log(`  Kelompok: ${group.name}`);
  console.log('\nHapus semua data uji dengan: node --env-file=.env.local scripts/purge-test-data.mjs');
}

main().catch((e) => {
  console.error('Seed gagal:', e.message ?? e);
  process.exit(1);
});
