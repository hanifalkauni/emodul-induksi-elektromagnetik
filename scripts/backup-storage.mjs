// Backup berkas Storage (bucket emodul-uploads) ke folder lokal. pg_dump tidak memuat isi berkas Storage.
// Menulis manifest.json (path, ukuran, jenis, sha256) agar restore bisa diverifikasi.
//
//   node --env-file=.env.local scripts/backup-storage.mjs <folder-tujuan> [--prefix <path>]
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { admin, listStorage } from './lib/admin-client.mjs';

const BUCKET = 'emodul-uploads';
const args = process.argv.slice(2);
const out = args[0] && !args[0].startsWith('--') ? resolve(args[0]) : null;
const prefixIdx = args.indexOf('--prefix');
const prefix = prefixIdx >= 0 ? args[prefixIdx + 1] ?? '' : '';
if (!out) {
  console.error('Pakai: node --env-file=.env.local scripts/backup-storage.mjs <folder-tujuan> [--prefix <path>]');
  process.exit(1);
}
const safe = (p) => {
  // Path Storage selalu {uuid}/{uuid}/{uuid}/{jenis}-{uuid}.{ext}; tolak apa pun yang bisa keluar dari folder
  if (p.split('/').some((seg) => seg === '..' || seg === '' || seg.includes('\\'))) throw new Error(`Path tidak aman: ${p}`);
  return p;
};

const paths = await listStorage(prefix, BUCKET);
const manifest = { bucket: BUCKET, prefix, created_at: new Date().toISOString(), files: [] };
let bytes = 0;
for (const p of paths) {
  const { data, error } = await admin.storage.from(BUCKET).download(safe(p));
  if (error) throw new Error(`Unduh ${p} gagal: ${error.message}`);
  const buf = Buffer.from(await data.arrayBuffer());
  const target = join(out, 'objects', ...p.split('/'));
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, buf);
  manifest.files.push({ path: p, size: buf.length, type: data.type || 'application/octet-stream', sha256: createHash('sha256').update(buf).digest('hex') });
  bytes += buf.length;
}
await mkdir(out, { recursive: true });
await writeFile(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Backup Storage: ${manifest.files.length} berkas, ${(bytes / 1048576).toFixed(2)} MB -> ${out}`);
