// Normalisasi NIS, aturan PIN, dan hash PIN (spec 3.2, 3.6).
// pin_hash = scrypt(HMAC-SHA256(PEPPER, school_id:nis:pin), salt). PEPPER tidak pernah disimpan di database.

import { createHmac, randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { env } from './env.js';

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32, maxmem: 64 * 1024 * 1024 };

function scrypt(password, salt, keylen, options) {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export function normalizeNis(raw) {
  return String(raw ?? '').replace(/\s+/g, '').toUpperCase();
}

export function isValidNis(nis) {
  return /^[A-Z0-9]{4,20}$/.test(nis);
}

export function normalizeCode(raw) {
  return String(raw ?? '').replace(/\s+/g, '').toUpperCase();
}

/** Kode kelas/sekolah: 6 karakter dari 32 simbol tanpa 0/O/1/I (D15). */
export function isValidCode(code) {
  return /^[A-HJ-NP-Z2-9]{6}$/.test(code);
}

const WEAK_PINS = new Set(['123123', '121212', '112233', '111222', '159753', '147258', '102030', '696969']);

/** Mengembalikan pesan galat bila PIN terlalu mudah, atau null bila diterima. */
export function pinPolicyError(pin, nis = '') {
  if (!/^\d{6}$/.test(pin)) return 'PIN harus tepat 6 angka.';
  if (/^(\d)\1{5}$/.test(pin)) return 'PIN tidak boleh berisi angka yang sama semua.';
  if ('0123456789012345'.includes(pin) || '9876543210987654'.includes(pin)) {
    return 'PIN tidak boleh berupa angka berurutan.';
  }
  if (WEAK_PINS.has(pin)) return 'PIN terlalu mudah ditebak. Pilih kombinasi lain.';
  const nisDigits = String(nis).replace(/\D/g, '');
  if (nisDigits.length >= 6 && nisDigits.includes(pin)) return 'PIN tidak boleh sama dengan bagian dari NIS.';
  return null;
}

function peppered(schoolId, nis, pin) {
  return createHmac('sha256', env('PEPPER')).update(`${schoolId}:${nis}:${pin}`).digest();
}

export async function hashPin(schoolId, nis, pin) {
  const salt = randomBytes(16);
  const key = await scrypt(peppered(schoolId, nis, pin), salt, SCRYPT.keylen, SCRYPT);
  return {
    pin_hash: `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${key.toString('hex')}`,
    pin_salt: salt.toString('hex'),
  };
}

export async function verifyPin(schoolId, nis, pin, stored) {
  const parts = String(stored?.pin_hash ?? '').split('$');
  if (parts.length !== 5 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, hex] = parts;
  const expected = Buffer.from(hex, 'hex');
  const key = await scrypt(peppered(schoolId, nis, pin), Buffer.from(stored.pin_salt, 'hex'), expected.length, {
    N: Number(N), r: Number(r), p: Number(p), maxmem: SCRYPT.maxmem,
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** Hitung hash palsu agar waktu respons sama saat NIS tidak ditemukan (spec 3.3 langkah 4). */
export async function dummyVerify() {
  await scrypt(randomBytes(32), randomBytes(16), SCRYPT.keylen, SCRYPT);
  return false;
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 simbol, tanpa 0/O/1/I (D15)

/** Kode acak dari 32 simbol (randomInt tanpa bias). */
export function genCode(length) {
  let out = '';
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return out;
}

/** PIN sementara 6 angka yang lolos aturan PIN (dipakai saat guru mereset PIN). */
export function genTempPin(nis) {
  for (;;) {
    const pin = String(randomInt(1_000_000)).padStart(6, '0');
    if (!pinPolicyError(pin, nis)) return pin;
  }
}

/** Kode aktivasi guru: 10 karakter (sekitar 50 bit), ditampilkan sebagai XXXXX-XXXXX. */
export function normalizeInviteCode(raw) {
  return String(raw ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export function isValidInviteCode(code) {
  return /^[A-HJ-NP-Z2-9]{10}$/.test(code);
}

export function formatInviteCode(code) {
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}

/** Hanya hash kode yang disimpan di database. */
export function inviteHash(code) {
  return createHmac('sha256', env('PEPPER')).update(`invite:${code}`).digest('hex');
}

/** Hash HMAC untuk IP/kunci laju, agar IP tidak tersimpan mentah. */
export function hmacKey(value) {
  return createHmac('sha256', env('PEPPER')).update(`rl:${value}`).digest('hex').slice(0, 32);
}
