// CAPTCHA (Cloudflare Turnstile) dan pembatas laju.

import { env, optionalEnv } from './env.js';
import { HttpError } from './http.js';
import { admin } from './supabase.js';
import { hmacKey } from './pin.js';

export async function verifyCaptcha(token, ip) {
  if (!token || typeof token !== 'string' || token.length > 2048) {
    throw new HttpError(400, 'captcha_required', 'Selesaikan verifikasi keamanan terlebih dahulu.');
  }
  const form = new URLSearchParams({ secret: env('TURNSTILE_SECRET_KEY'), response: token });
  if (ip) form.set('remoteip', ip);
  let result;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(8000),
    });
    result = await res.json();
  } catch (e) {
    console.error('Turnstile tidak bisa dihubungi:', e?.message);
    throw new HttpError(503, 'captcha_unavailable', 'Verifikasi keamanan sedang bermasalah. Coba lagi.');
  }
  if (!result?.success) {
    throw new HttpError(400, 'captcha_failed', 'Verifikasi keamanan gagal. Muat ulang lalu coba lagi.');
  }
}

/**
 * Tolak bila kunci (mis. IP) melebihi batas dalam jendela waktu. Batas dapat diatur lewat env
 * (mis. RL_LOGIN_PER_IP) untuk sekolah yang banyak siswanya keluar lewat satu IP.
 */
export async function rateLimit(bucket, identity, defaultMax, windowSeconds) {
  const max = Number(optionalEnv(`RL_${bucket.toUpperCase()}`, String(defaultMax))) || defaultMax;
  const { data, error } = await admin().rpc('rate_limit_hit', {
    p_key: `${bucket}:${hmacKey(identity)}`,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    // Database bermasalah: jangan blokir pengguna, tetapi catat.
    console.error('rate_limit_hit gagal:', error.message);
    return;
  }
  if (data === false) {
    throw new HttpError(429, 'too_many_requests', 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.');
  }
}

export async function logEvent(row) {
  const { error } = await admin().from('auth_events').insert(row);
  if (error) console.error('auth_events gagal dicatat:', error.message);
}
