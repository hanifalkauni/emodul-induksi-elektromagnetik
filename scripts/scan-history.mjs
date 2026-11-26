// Cari nilai rahasia dari .env.local di SELURUH riwayat git (semua commit, semua cabang). Nilai tidak dicetak.
//   node --env-file=.env.local scripts/scan-history.mjs
import { execFileSync } from 'node:child_process';
const names = ['SUPABASE_SECRET_KEY', 'SUPABASE_DB_PASSWORD', 'PEPPER', 'PEPPER_PREVIOUS', 'CRON_SECRET', 'TURNSTILE_SECRET_KEY', 'BACKUP_PASSPHRASE'];
const history = execFileSync('git', ['log', '--all', '-p', '--no-color', '--full-history'], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
const commits = execFileSync('git', ['rev-list', '--all', '--count'], { encoding: 'utf8' }).trim();
let leaks = 0;
let checked = 0;
for (const name of names) {
  const value = process.env[name];
  if (!value || value.length < 12 || value.startsWith('1x000')) continue; // kunci uji Turnstile publik
  checked++;
  if (history.includes(value)) {
    leaks++;
    console.log(`BOCOR: nilai ${name} ditemukan di riwayat git`);
  }
}
// Pola umum kunci Supabase rahasia / JWT service_role, apa pun nilainya
const patterns = [/sb_secret_[A-Za-z0-9_-]{20,}/, /eyJhbGciOi[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/];
for (const p of patterns) if (p.test(history)) { leaks++; console.log(`BOCOR: pola ${p.source.slice(0, 20)}... ditemukan`); }
console.log(`${commits} commit diperiksa, ${checked} nilai rahasia + ${patterns.length} pola, temuan: ${leaks}`);
process.exit(leaks ? 1 : 0);
