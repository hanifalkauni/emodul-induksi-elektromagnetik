// Cek cepat bahwa /api/* terlayani oleh dev server Vite (npm run dev harus berjalan).
//   node scripts/test-api-dev.mjs [baseUrl]
const base = process.argv[2] ?? 'http://localhost:5173';

async function post(path, body) {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.text() };
}

const checks = [
  ['GET / (aplikasi)', async () => (await fetch(base + '/')).status === 200],
  ['POST /api/auth/login NIS tak dikenal -> 401', async () => {
    const r = await post('/api/auth/login', { nis: 'XXXX0000', pin: '000001', captchaToken: 'XXXX.DUMMY.TOKEN.XXXX' });
    return r.status === 401 && r.body.includes('NIS atau PIN salah');
  }],
  ['POST /api/tidakada -> 404', async () => (await post('/api/tidakada', {})).status === 404],
  ['GET /api/auth/login -> 405', async () => (await fetch(base + '/api/auth/login')).status === 405],
];

let failed = 0;
for (const [name, fn] of checks) {
  let ok = false;
  try { ok = await fn(); } catch (e) { console.log(`  error: ${e.message}`); }
  if (!ok) failed++;
  console.log(`${ok ? 'LULUS' : 'GAGAL'}  ${name}`);
}
process.exit(failed ? 1 : 0);
