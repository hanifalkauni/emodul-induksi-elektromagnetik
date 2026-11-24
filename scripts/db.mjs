// Pembungkus Supabase CLI untuk menjalankan migrasi ke project cloud tanpa mengetik URL/password.
//
// Pakai:
//   node --env-file=.env.local scripts/db.mjs dry      # lihat migrasi yang akan dijalankan
//   node --env-file=.env.local scripts/db.mjs push     # jalankan migrasi
//   node --env-file=.env.local scripts/db.mjs list     # daftar migrasi lokal vs remote
//
// Koneksi langsung (db.<ref>.supabase.co) hanya IPv6, jadi dipakai Supavisor pooler (session mode, port 5432).
// Host pooler ditentukan lewat SUPABASE_POOLER_HOST bila diisi; selain itu dicoba beberapa kandidat region Singapore.

import { spawnSync } from 'node:child_process';

const mode = process.argv[2] ?? 'dry';
const ref = process.env.SUPABASE_PROJECT_REF;
const password = process.env.SUPABASE_DB_PASSWORD;

if (!ref || !password) {
  console.error('SUPABASE_PROJECT_REF dan SUPABASE_DB_PASSWORD wajib diisi di .env.local');
  process.exit(1);
}

const hosts = process.env.SUPABASE_POOLER_HOST
  ? [process.env.SUPABASE_POOLER_HOST]
  : ['aws-1-ap-southeast-1.pooler.supabase.com', 'aws-0-ap-southeast-1.pooler.supabase.com'];

const mask = (s) =>
  s.split(password).join('***').split(encodeURIComponent(password)).join('***');

const args = {
  dry: ['db', 'push', '--dry-run'],
  push: ['db', 'push', '--yes'],
  list: ['migration', 'list'],
}[mode];

if (!args) {
  console.error('Mode tidak dikenal. Gunakan: dry | push | list');
  process.exit(1);
}

let lastOutput = '';
for (const host of hosts) {
  const url = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@${host}:5432/postgres`;
  console.log(`\n>>> ${host}`);
  const res = spawnSync('npx', ['--yes', 'supabase@latest', ...args, '--db-url', url], {
    encoding: 'utf8',
    shell: true,
  });
  const out = mask(`${res.stdout ?? ''}\n${res.stderr ?? ''}`).trim();
  lastOutput = out;
  console.log(out.split('\n').slice(-25).join('\n'));
  if (res.status === 0) {
    console.log(`\nOK via ${host}`);
    console.log(`(simpan: SUPABASE_POOLER_HOST=${host})`);
    process.exit(0);
  }
  if (!/tenant or user not found|no route|ENOTFOUND|timeout|connection refused/i.test(out)) break;
}
console.error('\nGagal. Lihat output di atas.');
process.exit(1);
