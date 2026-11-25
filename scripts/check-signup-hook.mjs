// Periksa pengaturan pendaftaran Auth + hook "Before User Created" (Fase 2).
//   node --env-file=.env.local scripts/check-signup-hook.mjs
import { randomBytes } from 'node:crypto';
import { admin, anonClient, SUPABASE_URL, PUBLISHABLE_KEY } from './lib/admin-client.mjs';

const results = [];
const record = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'LULUS' : 'GAGAL'}  ${name}${detail ? `  (${detail})` : ''}`);
};
const cleanup = [];
const pw = () => randomBytes(18).toString('base64url');

const settings = await (await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: PUBLISHABLE_KEY } })).json();
record('Pendaftaran Auth dinyalakan (dibutuhkan login Google guru baru)', settings.disable_signup === false);
record('Google OAuth aktif', settings.external?.google === true);

// 1) Pendaftaran email publik dengan domain umum harus ditolak hook
{
  const { data, error } = await anonClient().auth.signUp({ email: `uji.hook.${Date.now()}@gmail.com`, password: pw() });
  if (data?.user?.id) cleanup.push(data.user.id);
  record('Hook menolak pendaftaran email publik (@gmail.com)', Boolean(error) && !data?.user,
    error ? `${error.status} ${error.message}` : 'malah berhasil: hook belum aktif');
}

// 2) Pembuatan user siswa oleh server (admin API, domain internal) harus tetap bisa
{
  const { data, error } = await admin.auth.admin.createUser({ email: `${crypto.randomUUID()}@siswa.emodul.invalid`, email_confirm: true });
  if (data?.user?.id) cleanup.push(data.user.id);
  record('Server tetap bisa membuat user internal siswa', !error && Boolean(data?.user), error?.message ?? '');
}

// 3) Pembuatan user lewat admin API dengan email biasa: tunjukkan apakah hook juga berlaku di sini
{
  const { data, error } = await admin.auth.admin.createUser({ email: `uji.hook.admin.${Date.now()}@gmail.com`, email_confirm: true });
  if (data?.user?.id) cleanup.push(data.user.id);
  console.log(`INFO   Admin API + email biasa: ${error ? `ditolak (${error.message})` : 'diizinkan'}`);
}

for (const id of cleanup) await admin.auth.admin.deleteUser(id).catch(() => {});
console.log(`\n${results.filter(Boolean).length}/${results.length} lulus. User uji dihapus.`);
process.exit(results.every(Boolean) ? 0 : 1);
