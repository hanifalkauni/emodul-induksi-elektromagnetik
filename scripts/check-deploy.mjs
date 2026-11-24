// Validasi deploy Vercel: apakah environment variable terbaca, tanpa mengubah data.
//
//   node scripts/check-deploy.mjs https://<project>.vercel.app
//   node --env-file=.env.local scripts/check-deploy.mjs https://<project>.vercel.app --full
//
// --full: juga mencoba daftar + masuk + ganti PIN sungguhan pada sekolah uji sementara, lalu menghapusnya.
//         Hanya bisa bila deploy itu memakai kunci UJI Turnstile (selalu lolos).

const base = (process.argv[2] ?? '').replace(/\/+$/, '');
const full = process.argv.includes('--full');
if (!/^https?:\/\//.test(base)) {
  console.error('Pakai: node scripts/check-deploy.mjs https://<project>.vercel.app [--full]');
  process.exit(1);
}

const results = [];
function record(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok === null ? 'INFO ' : ok ? 'LULUS' : 'GAGAL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function post(path, body, token) {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  let json = {};
  try { json = await res.json(); } catch { /* bukan JSON */ }
  return { status: res.status, body: json };
}

// 1) Halaman dan variabel VITE_* (ditanam saat build)
const home = await fetch(base + '/');
const html = await home.text();
record('Halaman utama bisa dibuka', home.status === 200, `HTTP ${home.status}`);

const scripts = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
let bundle = '';
for (const s of scripts) bundle += await (await fetch(base + s)).text();
const supabaseUrl = bundle.match(/https:\/\/[a-z0-9]{20}\.supabase\.co/)?.[0];
record('VITE_SUPABASE_URL tertanam di build', Boolean(supabaseUrl), supabaseUrl ?? 'tidak ditemukan: isi variabel lalu Redeploy');
record('VITE_SUPABASE_PUBLISHABLE_KEY tertanam di build', /sb_publishable_[A-Za-z0-9_-]{10,}/.test(bundle));
const siteKey = bundle.match(/0x[0-9A-Za-z_-]{20,}|1x00000000000000000000AA|2x00000000000000000000AB|3x00000000000000000000FF/)?.[0];
record('VITE_TURNSTILE_SITE_KEY tertanam di build', Boolean(siteKey),
  siteKey ? (siteKey.startsWith('1x') ? 'kunci UJI (selalu lolos)' : 'kunci asli') : 'tidak ditemukan');
if (/sb_secret_[A-Za-z0-9]/.test(bundle)) record('RAHASIA BOCOR: sb_secret_ ada di bundel browser!', false);
else record('Tidak ada secret key di bundel browser', true);

// 2) Fungsi server dan variabel rahasia
const spa = await fetch(base + '/guru');
record('Rute aplikasi (SPA) tidak 404', spa.status === 200, `HTTP ${spa.status}`);

const notFound = await post('/api/tidakada', {});
record('Fungsi /api aktif (endpoint tak dikenal = 404 JSON)', notFound.status === 404 && notFound.body.error === 'not_found',
  `HTTP ${notFound.status} ${notFound.body.error ?? ''}`);

const noCaptcha = await post('/api/auth/login', { nis: 'CEKDEPLOY1', pin: '000001' });
if (noCaptcha.body.error === 'server_misconfigured') {
  record('Variabel server terbaca', false, 'ada variabel server yang kosong (SUPABASE_URL / SUPABASE_SECRET_KEY / TURNSTILE_SECRET_KEY / PEPPER)');
} else {
  record('Fungsi server merespons (tanpa CAPTCHA ditolak)', noCaptcha.status === 400 && noCaptcha.body.error === 'captcha_required',
    `HTTP ${noCaptcha.status} ${noCaptcha.body.error ?? ''}`);
}

const login = await post('/api/auth/login', { nis: 'CEKDEPLOY1', pin: '000001', captchaToken: 'XXXX.DUMMY.TOKEN.XXXX' });
const testCaptcha = login.status === 401 && login.body.error === 'invalid_credentials';
if (login.body.error === 'server_misconfigured') {
  record('SUPABASE_SECRET_KEY / PEPPER terbaca', false, 'server_misconfigured');
} else if (testCaptcha) {
  record('TURNSTILE_SECRET_KEY + SUPABASE_SECRET_KEY + PEPPER bekerja', true, 'kunci UJI Turnstile; login sampai ke database');
} else if (login.body.error === 'captcha_failed') {
  record('TURNSTILE_SECRET_KEY terbaca (kunci asli menolak token palsu)', true,
    'kunci asli: database tidak bisa diuji dari skrip, coba masuk lewat browser');
} else if (login.body.error === 'internal_error') {
  record('Akses database dari server', false, 'internal_error: periksa SUPABASE_URL dan SUPABASE_SECRET_KEY di log Vercel');
} else {
  record('Respons login tidak terduga', false, `HTTP ${login.status} ${JSON.stringify(login.body).slice(0, 120)}`);
}

// 3) Uji penuh (opsional)
if (full) {
  if (!testCaptcha) {
    record('Uji penuh dilewati', null, 'deploy ini tidak memakai kunci uji Turnstile');
  } else {
    const { admin } = await import('./lib/admin-client.mjs');
    const run = Date.now().toString(36).toUpperCase().slice(-6);
    const { data: school } = await admin.from('schools').insert({ name: `UJI DEPLOY ${run}`, is_test: true }).select().single();
    try {
      const { data: klass } = await admin.from('classes').insert({ school_id: school.id, name: 'Kelas Uji Deploy' }).select().single();
      const nis = `D${run}`;
      const reg = await post('/api/auth/register', { classCode: klass.join_code, nis, name: 'Uji Deploy', groupName: 'K1',
        pin: '583914', pinConfirm: '583914', captchaToken: 'XXXX.DUMMY.TOKEN.XXXX' });
      record('Daftar di deploy', reg.status === 201, reg.body.message ?? '');
      const lg = await post('/api/auth/login', { nis, pin: '583914', captchaToken: 'XXXX.DUMMY.TOKEN.XXXX' });
      record('Masuk di deploy (sesi Supabase terbit)', lg.status === 200 && Boolean(lg.body.session?.access_token), lg.body.message ?? '');
      const cp = await post('/api/auth/change-pin', { oldPin: '583914', newPin: '640281', newPinConfirm: '640281' }, lg.body.session?.access_token);
      record('Ganti PIN di deploy', cp.status === 200, cp.body.message ?? '');
    } finally {
      const { data: students } = await admin.from('students').select('id').eq('school_id', school.id);
      for (const s of students ?? []) await admin.auth.admin.deleteUser(s.id);
      await admin.from('schools').delete().eq('id', school.id);
      console.log('Data uji deploy dihapus.');
    }
  }
}

const failed = results.filter((r) => r.ok === false).length;
console.log(`\n${failed ? `${failed} pemeriksaan GAGAL` : 'Semua pemeriksaan lulus.'}`);
process.exit(failed ? 1 : 0);
