// Jadikan user Supabase yang SUDAH ADA sebagai admin (spec 3.7, D12).
// Peran admin sengaja tidak bisa didapat dari aplikasi; hanya lewat skrip ini (secret key) atau SQL.
//
//   node --env-file=.env.local scripts/make-admin.mjs <email>
//   node --env-file=.env.local scripts/make-admin.mjs <email> --revoke   # cabut peran admin

import { admin } from './lib/admin-client.mjs';

const email = (process.argv[2] ?? '').trim().toLowerCase();
const revoke = process.argv.includes('--revoke');
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('Pakai: node --env-file=.env.local scripts/make-admin.mjs <email> [--revoke]');
  process.exit(1);
}

async function findUserByEmail(target) {
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => (u.email ?? '').toLowerCase() === target);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

const user = await findUserByEmail(email);
if (!user) {
  console.error(`User ${email} tidak ditemukan. Buat dulu di Supabase > Authentication > Users > Add user.`);
  process.exit(1);
}

const { data: student } = await admin.from('students').select('id').eq('id', user.id).maybeSingle();
if (student) {
  console.error('User ini adalah akun siswa, tidak bisa dijadikan admin.');
  process.exit(1);
}

if (revoke) {
  const { error } = await admin.from('profiles').update({ status: 'disabled' }).eq('user_id', user.id).eq('role', 'admin');
  if (error) throw error;
  console.log(`Peran admin ${email} dinonaktifkan.`);
  process.exit(0);
}

const { error } = await admin.from('profiles').upsert(
  { user_id: user.id, role: 'admin', status: 'active', school_id: null, email, display_name: 'Admin' },
  { onConflict: 'user_id' },
);
if (error) throw error;

console.log(`OK: ${email} sekarang admin.`);
console.log(`  Email terkonfirmasi : ${user.email_confirmed_at ? 'ya' : 'BELUM (centang Auto Confirm / konfirmasi dulu)'}`);
console.log(`  Metode masuk        : ${(user.app_metadata?.providers ?? [user.app_metadata?.provider]).filter(Boolean).join(', ')}`);
