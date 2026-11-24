// Klien Supabase untuk skrip lokal (seed, pembersih, uji). Memakai SECRET key: JANGAN dipakai di browser.
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

export const SUPABASE_URL = required('SUPABASE_URL');
const SECRET_KEY = required('SUPABASE_SECRET_KEY');
export const PUBLISHABLE_KEY = required('VITE_SUPABASE_PUBLISHABLE_KEY');

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Variabel ${name} kosong. Jalankan dengan: node --env-file=.env.local ...`);
    process.exit(1);
  }
  return v;
}

const noPersist = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

export const admin = createClient(SUPABASE_URL, SECRET_KEY, noPersist);

/** Klien tanpa sesi (seperti pengunjung anonim di browser). */
export function anonClient() {
  return createClient(SUPABASE_URL, PUBLISHABLE_KEY, noPersist);
}

/** Klien atas nama pengguna tertentu (memakai access token). */
export function userClient(accessToken) {
  return createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    ...noPersist,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/** Email sintetis untuk user Auth internal siswa (spec 3.4). */
export function syntheticStudentEmail() {
  return `${randomUUID()}@siswa.emodul.invalid`;
}

/** Buat user Auth tanpa password yang bisa dipakai (email sudah dikonfirmasi). */
export async function createAuthUser(email) {
  const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (error) throw new Error(`createUser gagal: ${error.message}`);
  return data.user;
}

/**
 * Terbitkan sesi untuk user yang sudah diverifikasi server (spec 3.4, keputusan D8):
 * generateLink(magiclink) -> verifyOtp(token_hash). Tidak ada email yang dikirim.
 */
export async function issueSession(email) {
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (linkErr) throw new Error(`generateLink gagal: ${linkErr.message}`);
  const tokenHash = link?.properties?.hashed_token;
  if (!tokenHash) throw new Error('generateLink tidak mengembalikan hashed_token');

  const client = anonClient();
  const { data, error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' });
  if (error) throw new Error(`verifyOtp gagal: ${error.message}`);
  if (!data.session?.access_token || !data.session?.refresh_token) {
    throw new Error('verifyOtp tidak mengembalikan sesi lengkap');
  }
  return data.session;
}

export function guardNotProduction() {
  if ((process.env.APP_ENV ?? '').toLowerCase() === 'production') {
    console.error('Ditolak: APP_ENV=production. Skrip ini hanya untuk data uji.');
    process.exit(1);
  }
}
