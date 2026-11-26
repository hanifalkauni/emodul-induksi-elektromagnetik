// Restore berkas Storage dari folder hasil backup-storage.mjs. Berkas yang sudah ada dilewati (tidak ditimpa),
// isi tiap berkas dicek dengan sha256 dari manifest.
//
//   node --env-file=.env.local scripts/restore-storage.mjs <folder-backup> [--yes]
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { admin, SUPABASE_URL } from './lib/admin-client.mjs';

const args = process.argv.slice(2);
const dir = args[0] && !args[0].startsWith('--') ? resolve(args[0]) : null;
if (!dir) {
  console.error('Pakai: node --env-file=.env.local scripts/restore-storage.mjs <folder-backup> [--yes]');
  process.exit(1);
}
const manifest = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));
if (!args.includes('--yes')) {
  console.log(`Akan memulihkan ${manifest.files.length} berkas ke bucket ${manifest.bucket} di ${SUPABASE_URL}.`);
  console.log('Jalankan ulang dengan --yes untuk melanjutkan.');
  process.exit(0);
}
let restored = 0;
let skipped = 0;
for (const f of manifest.files) {
  if (f.path.split('/').some((seg) => seg === '..' || seg === '')) throw new Error(`Path tidak aman: ${f.path}`);
  const buf = await readFile(join(dir, 'objects', ...f.path.split('/')));
  if (createHash('sha256').update(buf).digest('hex') !== f.sha256) throw new Error(`Isi berkas rusak (sha256 beda): ${f.path}`);
  const { error } = await admin.storage.from(manifest.bucket).upload(f.path, buf, { contentType: f.type, upsert: false });
  if (error && /exists|duplicate/i.test(error.message)) skipped++;
  else if (error) throw new Error(`Unggah ${f.path} gagal: ${error.message}`);
  else restored++;
}
console.log(`Restore Storage: ${restored} dipulihkan, ${skipped} sudah ada (dilewati).`);
