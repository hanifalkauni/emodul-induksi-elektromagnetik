// Klien Supabase sisi server (SECRET key). Tidak pernah dikirim ke browser.

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { env } from './env.js';
import { HttpError } from './http.js';

const NO_PERSIST = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

let adminClient = null;
export function admin() {
  if (!adminClient) {
    adminClient = createClient(env('SUPABASE_URL'), env('SUPABASE_SECRET_KEY'), { auth: NO_PERSIST });
  }
  return adminClient;
}

/** Email sintetis acak untuk user Auth internal siswa (spec 3.4). */
export function syntheticStudentEmail() {
  return `${randomUUID()}@siswa.emodul.invalid`;
}

/**
 * Terbitkan sesi untuk user yang PIN-nya sudah diverifikasi server (D8):
 * generateLink(magiclink) lalu verifyOtp(token_hash). Tidak ada email yang dikirim.
 *
 * Header Sb-Forwarded-For meneruskan IP siswa agar batas laju Supabase Auth dihitung per siswa,
 * bukan per IP server Vercel. Berlaku bila "IP Address Forwarding" diaktifkan di
 * Authentication > Rate Limits; bila belum, header diabaikan.
 */
export async function issueSession(email, ip) {
  const { data: link, error: linkErr } = await admin().auth.admin.generateLink({ type: 'magiclink', email });
  const tokenHash = link?.properties?.hashed_token;
  if (linkErr || !tokenHash) {
    console.error('generateLink gagal:', linkErr?.message);
    throw new HttpError(503, 'session_unavailable', 'Gagal membuat sesi. Coba lagi sebentar lagi.');
  }

  const verifier = createClient(env('SUPABASE_URL'), env('SUPABASE_SECRET_KEY'), {
    auth: NO_PERSIST,
    global: { headers: ip ? { 'Sb-Forwarded-For': ip } : {} },
  });
  const { data, error } = await verifier.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' });
  const session = data?.session;
  if (error || !session?.access_token || !session?.refresh_token) {
    console.error('verifyOtp gagal:', error?.status, error?.message);
    if (error?.status === 429) {
      throw new HttpError(429, 'too_many_requests', 'Terlalu banyak percobaan masuk dari jaringan ini. Tunggu beberapa menit.');
    }
    throw new HttpError(503, 'session_unavailable', 'Gagal membuat sesi. Coba lagi sebentar lagi.');
  }
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  };
}

/** Ambil user dari access token pemanggil (untuk endpoint yang butuh sesi). */
export async function userFromToken(token) {
  if (!token) throw new HttpError(401, 'unauthenticated', 'Sesi tidak ditemukan. Silakan masuk lagi.');
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, 'unauthenticated', 'Sesi berakhir. Silakan masuk lagi.');
  return data.user;
}
