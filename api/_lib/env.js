// Variabel lingkungan sisi server. Dibaca saat dipakai (bukan saat impor) agar galat konfigurasi
// muncul sebagai respons 500 yang jelas, bukan crash saat fungsi dimuat.

export function env(name) {
  const value = process.env[name];
  if (!value) {
    const err = new Error(`Konfigurasi server belum lengkap: ${name}`);
    err.status = 500;
    err.code = 'server_misconfigured';
    throw err;
  }
  return value;
}

export function optionalEnv(name, fallback = '') {
  return process.env[name] || fallback;
}
