// Uji backup + restore Storage (Fase 6): unggah berkas uji, backup prefix-nya, hapus, restore, bandingkan isi.
//   node --env-file=.env.local scripts/test-storage-backup.mjs
import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { admin, guardNotProduction, listStorage, removeStoragePrefix } from './lib/admin-client.mjs';
guardNotProduction();
const BUCKET = 'emodul-uploads';
const results = [];
const ok = (name, cond, detail = '') => {
  results.push(cond);
  console.log(`${cond ? 'LULUS' : 'GAGAL'}  ${name}${detail ? `  (${detail})` : ''}`);
};
const { data: school } = await admin.from('schools').insert({ name: `UJI BACKUP ${Date.now()}`, is_test: true }).select().single();
const prefix = `${school.id}/${randomUUID()}/${randomUUID()}`;
const dir = await mkdtemp(join(tmpdir(), 'emodul-backup-'));
const run = (script, ...a) => execFileSync(process.execPath, ['--env-file=.env.local', `scripts/${script}`, ...a], { encoding: 'utf8' });
try {
  const originals = {};
  for (const kind of ['process_photo', 'prototype_photo', 'lab_report']) {
    const p = `${prefix}/${kind}-${randomUUID()}.${kind === 'lab_report' ? 'pdf' : 'jpg'}`;
    const buf = randomBytes(5000);
    const { error } = await admin.storage.from(BUCKET).upload(p, buf, { contentType: kind === 'lab_report' ? 'application/pdf' : 'image/jpeg' });
    if (error) throw error;
    originals[p] = createHash('sha256').update(buf).digest('hex');
  }
  const outB = run('backup-storage.mjs', dir, '--prefix', prefix);
  const manifest = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));
  ok('Backup mengunduh semua berkas dengan sha256 di manifest', manifest.files.length === 3 && manifest.files.every((f) => originals[f.path] === f.sha256), outB.trim());
  await removeStoragePrefix(prefix);
  ok('Berkas dihapus (simulasi kehilangan)', (await listStorage(prefix)).length === 0);
  const dry = run('restore-storage.mjs', dir);
  ok('Restore tanpa --yes hanya menampilkan rencana', /Jalankan ulang dengan --yes/.test(dry) && (await listStorage(prefix)).length === 0);
  const outR = run('restore-storage.mjs', dir, '--yes');
  const back = await listStorage(prefix);
  let same = back.length === 3;
  for (const p of back) {
    const { data } = await admin.storage.from(BUCKET).download(p);
    same &&= createHash('sha256').update(Buffer.from(await data.arrayBuffer())).digest('hex') === originals[p];
  }
  ok('Restore memulihkan semua berkas dengan isi identik', same, outR.trim());
  const again = run('restore-storage.mjs', dir, '--yes');
  ok('Restore ulang tidak menimpa berkas yang sudah ada', /0 dipulihkan, 3 sudah ada/.test(again), again.trim());
} finally {
  await removeStoragePrefix(school.id).catch(() => {});
  await admin.from('schools').delete().eq('id', school.id);
  await rm(dir, { recursive: true, force: true });
}
const passed = results.filter(Boolean).length;
console.log(`Hasil: ${passed}/${results.length} lulus. Data uji dihapus.`);
process.exit(passed === results.length ? 0 : 1);
