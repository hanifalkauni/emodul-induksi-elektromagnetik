// Pemeriksaan cepat kondisi project (tanpa mengubah apa pun).
//   node --env-file=.env.local scripts/check-project.mjs
import { admin, SUPABASE_URL, PUBLISHABLE_KEY } from './lib/admin-client.mjs';

const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: PUBLISHABLE_KEY } });
const settings = await res.json();
console.log(`Pendaftaran terbuka Auth dimatikan : ${settings.disable_signup === true ? 'YA' : 'TIDAK (matikan di dashboard!)'}`);
console.log(`Google OAuth aktif                 : ${settings.external?.google ? 'ya' : 'belum (diperlukan di Fase 2)'}`);

const { count: schools } = await admin.from('schools').select('*', { count: 'exact', head: true });
const { count: testSchools } = await admin.from('schools').select('*', { count: 'exact', head: true }).eq('is_test', true);
const { count: students } = await admin.from('students').select('*', { count: 'exact', head: true });
const { count: profiles } = await admin.from('profiles').select('*', { count: 'exact', head: true });
const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
const { error: pingErr } = await admin.rpc('ping');
const { data: buckets } = await admin.storage.listBuckets();

console.log(`RPC ping()                         : ${pingErr ? `GAGAL ${pingErr.message}` : 'ok'}`);
console.log(`Bucket emodul-uploads              : ${buckets?.find((b) => b.id === 'emodul-uploads' && !b.public) ? 'ada, privat' : 'TIDAK ADA'}`);
console.log(`Sekolah (uji)                      : ${schools} (${testSchools})`);
console.log(`Siswa / profil staf                : ${students} / ${profiles}`);
console.log(`User Auth                          : ${users?.users?.length ?? '?'}`);
