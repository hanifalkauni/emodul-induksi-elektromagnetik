// Pastikan nilai rahasia dari .env.local tidak ada di berkas yang di-stage git.
//   node --env-file=.env.local scripts/scan-secrets.mjs
import { execFileSync } from 'node:child_process';

const names = ['SUPABASE_SECRET_KEY', 'SUPABASE_DB_PASSWORD', 'PEPPER', 'CRON_SECRET', 'TURNSTILE_SECRET_KEY'];
const files = execFileSync('git', ['diff', '--cached', '--name-only'], { encoding: 'utf8' }).split('\n').filter(Boolean);
let leaks = 0;
for (const name of names) {
  const value = process.env[name];
  if (!value || value.length < 12 || value.startsWith('1x000')) continue; // kunci uji Turnstile publik
  for (const file of files) {
    let content = '';
    try {
      content = execFileSync('git', ['show', `:${file}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    } catch {
      continue;
    }
    if (content.includes(value)) {
      console.log(`BOCOR: ${name} di ${file}`);
      leaks++;
    }
  }
}
console.log(`${files.length} berkas di-stage diperiksa, temuan rahasia: ${leaks}`);
process.exit(leaks ? 1 : 0);
