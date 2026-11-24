// Pembantu HTTP: respons JSON, galat terstruktur, dan pembacaan body yang dibatasi ukurannya.

export class HttpError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

const SECURITY_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

export function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: SECURITY_HEADERS });
}

export function errorResponse(err) {
  if (err instanceof HttpError) {
    return json(err.status, { error: err.code, message: err.message, ...err.extra });
  }
  if (err?.code === 'server_misconfigured') {
    console.error(err.message);
    return json(500, { error: 'server_misconfigured', message: 'Server belum dikonfigurasi dengan benar.' });
  }
  // Jangan bocorkan detail internal ke klien
  console.error('Galat tak terduga:', err?.message ?? err);
  return json(500, { error: 'internal_error', message: 'Terjadi kesalahan di server. Coba lagi sebentar lagi.' });
}

const MAX_BODY_BYTES = 8 * 1024;

export async function readJson(request) {
  const type = request.headers.get('content-type') ?? '';
  if (!type.toLowerCase().includes('application/json')) {
    throw new HttpError(415, 'unsupported_media_type', 'Gunakan Content-Type application/json.');
  }
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    throw new HttpError(413, 'payload_too_large', 'Data yang dikirim terlalu besar.');
  }
  try {
    const data = JSON.parse(text || '{}');
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('bukan objek');
    return data;
  } catch {
    throw new HttpError(400, 'invalid_json', 'Format data tidak valid.');
  }
}

/** IP pengguna dari header proxy Vercel. Hanya entri pertama yang dipakai. */
export function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip')?.trim() || '127.0.0.1';
}

export function bearerToken(request) {
  const auth = request.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  return match ? match[1].trim() : null;
}

export function str(value, maxLen = 200) {
  if (typeof value !== 'string') return '';
  return value.slice(0, maxLen);
}
