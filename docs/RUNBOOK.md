# Runbook Operasional E-Modul Induksi Elektromagnetik

Panduan langkah demi langkah untuk admin. Setiap bagian bisa dibaca terpisah. Perintah `npm run ...` dan
`node ... scripts/...` dijalankan di folder repo dengan `.env.local` terisi (lihat `.env.example`).

| Komponen | Lokasi |
|---|---|
| Aplikasi | https://emodul-induksi-elektromagnetik.vercel.app (`/` siswa, `/guru`, `/admin`) |
| Hosting dan cron | Vercel (Hobby), project `emodul-induksi-elektromagnetik` |
| Database, Auth, Storage, Realtime | Supabase (Free), project ref `ivcewywkqvpdmvhqzzcb`, region Singapore |
| Backup mingguan | GitHub Actions, workflow `Backup mingguan` (`.github/workflows/backup.yml`) |
| Spesifikasi | `docs/SPEC_Database_Supabase.md` |

**Rahasia** (hanya di Vercel > Settings > Environment Variables, `.env.local`, dan password manager; tidak pernah di repo):
`SUPABASE_SECRET_KEY`, `PEPPER`, `PEPPER_PREVIOUS` (hanya saat rotasi), `CRON_SECRET`, `TURNSTILE_SECRET_KEY`,
`SUPABASE_DB_PASSWORD`, dan untuk backup `BACKUP_PASSPHRASE`. Simpan salinan `PEPPER` dan `BACKUP_PASSPHRASE` di
password manager: tanpa `PEPPER` semua PIN siswa tidak bisa diperiksa, tanpa `BACKUP_PASSPHRASE` backup tidak bisa dibuka.

---

## 1. Pemantauan rutin (5 menit, seminggu sekali)

1. Buka `/admin` > **Status Layanan**.
   - **Ping harian** harus "Normal" (berhasil dalam 36 jam terakhir).
   - **Pemeliharaan mingguan** harus "Normal" (berhasil dalam 8 hari terakhir).
   - Pemakaian **Database** (batas Free 500 MB) dan **Storage** (batas 1 GB). Kuning di 60%, merah di 80%.
2. GitHub > Actions > **Backup mingguan**: jalankan terakhir berwarna hijau, dan ada artifact `emodul-backup-<tanggal>`.
3. Supabase dashboard > project: status bukan "Paused".

Bila ping "Perlu dicek": Vercel > project > **Schedules** > tab **Cron Jobs** > **View Logs**.
- `401`: `CRON_SECRET` di Vercel kosong atau berubah tanpa redeploy. Lihat bagian 4.
- Tidak ada jalannya sama sekali: pastikan cron tidak di-**Disable**, dan deploy production terakhir memuat `crons` di `vercel.json`.
- `503 db_unavailable`: project Supabase di-pause. Lihat bagian 2.

Cek cepat dari laptop: `node --env-file=.env.local scripts/check-deploy.mjs https://emodul-induksi-elektromagnetik.vercel.app`.

## 2. Project Supabase di-pause

Gejala: siswa tidak bisa masuk ("Tidak bisa terhubung ke server" / galat 503), dashboard Supabase menampilkan "Paused".
Aplikasi tetap bisa dipakai siswa yang sudah masuk; jawaban tersimpan di perangkat dan dikirim saat server kembali.

1. Supabase dashboard > project > **Restore project** (gratis; beberapa menit). Data tidak hilang selama project
   belum melewati batas waktu restore yang tertera di dashboard.
2. Setelah aktif, panggil ping manual:
   `curl -H "Authorization: Bearer <CRON_SECRET>" https://emodul-induksi-elektromagnetik.vercel.app/api/ping` harus `200`.
3. Cari penyebab cron tidak jalan (bagian 1) agar tidak terulang.

## 3. Menambah dan mencabut admin

- Tambah: buat user di Supabase dashboard > Authentication > Users (email + password), lalu
  `npm run admin:make -- email@contoh.id`.
- Cabut: `node --env-file=.env.local scripts/make-admin.mjs email@contoh.id --revoke`.

## 4. Rotasi `CRON_SECRET`

1. Buat nilai acak minimal 16 karakter huruf/angka (tanpa spasi).
2. Vercel > Environment Variables: ubah `CRON_SECRET` untuk **Production**. Simpan juga di `.env.local`.
3. **Redeploy** (nilai baru baru dipakai setelah deploy).
4. Keesokan harinya: Status Layanan > ping "Normal", atau Cron Jobs > View Logs menunjukkan `200`.

## 5. Rotasi `PEPPER` (terencana, misalnya dicurigai bocor)

`PEPPER` mencampur hash PIN siswa dan hash kode aktivasi guru. Aplikasi mendukung rotasi tanpa mereset PIN:
selama `PEPPER_PREVIOUS` terisi, PIN lama tetap diterima dan langsung di-hash ulang dengan `PEPPER` baru saat siswa masuk.
Diuji oleh `npm run test:ops` (bagian "simulasi rotasi PEPPER").

1. Buat nilai baru: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Simpan di password manager.
2. Vercel > Environment Variables (Production **dan** Preview):
   - `PEPPER_PREVIOUS` = nilai `PEPPER` yang sekarang,
   - `PEPPER` = nilai baru.
3. Redeploy. Perbarui `.env.local` dengan dua nilai yang sama.
4. Biarkan `PEPPER_PREVIOUS` terpasang selama masa transisi (misalnya 4 minggu, atau sampai satu semester bila banyak siswa
   jarang masuk). Kode aktivasi guru yang terbit sebelum rotasi tetap bisa ditebus selama masa ini.
5. Hapus `PEPPER_PREVIOUS`, lalu redeploy. Siswa yang belum pernah masuk selama transisi perlu **Reset PIN** oleh guru.

Efek samping yang wajar: hitungan batas laju dan hash IP di log audit memakai pepper baru (log lama tidak bisa dicocokkan dengan yang baru).

**Bila `PEPPER` bocor bersama isi database**, PIN 6 angka bisa ditebak secara offline. Lakukan rotasi di atas,
lalu minta guru **Reset PIN** setiap siswa agar PIN lama tidak berguna lagi. Hanya menandai "wajib ganti PIN"
tidak cukup, karena PIN lama masih bisa dipakai untuk masuk satu kali.

## 6. `PEPPER` hilang (tidak ada cadangan)

Hash PIN tidak bisa diperiksa lagi; tidak ada cara memulihkannya.
1. Pasang `PEPPER` baru (tanpa `PEPPER_PREVIOUS`), redeploy.
2. Semua siswa harus mendapat PIN sementara dari guru: halaman `/guru` > Kelola Siswa > **Reset PIN** per siswa
   (PIN sementara tampil sekali; siswa wajib membuat PIN baru saat masuk).
3. Kode aktivasi guru yang belum ditebus tidak berlaku; terbitkan ulang di `/admin`.

## 7. Backup

**Penyiapan (sekali):** GitHub > repo > Settings > Secrets and variables > Actions > New repository secret:
- `SUPABASE_DB_URL`: Supabase > Connect > **Session pooler**, lengkap dengan password database.
- `BACKUP_PASSPHRASE`: kata sandi panjang acak; simpan di password manager.
- `SUPABASE_URL` dan `SUPABASE_SECRET_KEY` (opsional) agar foto/berkas Storage ikut di-backup.

Repo ini **publik**: artifact bisa diunduh orang lain, karena itu backup selalu dienkripsi AES-256 dan hanya bisa dibuka dengan `BACKUP_PASSPHRASE`.

**Jadwal:** setiap Minggu 02:30 WIB, disimpan 30 hari. Jalankan manual: Actions > Backup mingguan > **Run workflow**.

Backup lokal tambahan untuk berkas Storage: `node --env-file=.env.local scripts/backup-storage.mjs <folder>`.

## 8. Restore dari backup

1. Unduh artifact `emodul-backup-<tanggal>` dari GitHub Actions, lalu buka (butuh gpg):
   ```bash
   gpg --decrypt emodul-backup-<tanggal>.tar.gz.gpg > backup.tar.gz
   mkdir backup && tar -xzf backup.tar.gz -C backup
   ```
   Isinya `db/roles.sql`, `db/schema.sql`, `db/data.sql`, `db/history_*.sql`, dan `storage/` (bila disertakan).
2. Buat project Supabase baru (atau project uji), region Singapore. Ambil connection string Session pooler-nya.
3. Pulihkan database (sesuai panduan resmi Supabase "Backup and Restore using the CLI"):
   ```bash
   psql --single-transaction --variable ON_ERROR_STOP=1 \
     --file db/roles.sql --file db/schema.sql \
     --command 'SET session_replication_role = replica' \
     --file db/data.sql --dbname "<CONNECTION_STRING_BARU>"
   psql --single-transaction --variable ON_ERROR_STOP=1 \
     --file db/history_schema.sql --file db/history_data.sql --dbname "<CONNECTION_STRING_BARU>"
   ```
4. Aktifkan lagi Realtime: Database > Publications > `supabase_realtime`: `ideas`, `idea_votes`, `group_state`,
   `group_roles`, `test_trials`.
5. Pulihkan berkas: isi `.env.local` dengan URL dan secret key project baru, lalu
   `node --env-file=.env.local scripts/restore-storage.mjs backup/storage --yes`
   (berkas yang sudah ada dilewati, isi diperiksa dengan sha256).
6. Supabase project baru: Authentication > Providers > Google (Client ID/secret sama), Auth Hooks > **Before User Created**
   = `public.hook_before_user_created`, Rate Limits seperti project lama.
7. Vercel: ganti `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY` ke project baru.
   **`PEPPER` harus sama dengan project lama**, kalau tidak semua PIN tidak berlaku. Redeploy.
8. Periksa: `scripts/check-deploy.mjs <url> --full`, lalu masuk sebagai guru dan siswa uji.

## 9. Mencabut guru

`/admin` > **Guru** > **Nonaktifkan**. Akun langsung tidak bisa memakai sesi lamanya (di-ban di Supabase Auth).
Bila kode aktivasi yang dipakai guru itu masih berlaku, cabut juga di tab **Kode Aktivasi**.

## 10. Menghapus data (permintaan penghapusan, UU PDP)

**Satu siswa:** `/guru` > kelas > Kelola Siswa > ikon hapus > ketik NIS. Terhapus: akun, jawaban pribadi, vote.
Yang tersisa dan perlu ditangani bila diminta:
- Ide yang ditulis siswa tetap di papan kelompok dengan nama pengusul (isian kelompok milik bersama). Hapus lewat
  Supabase > Table editor > `ideas` (filter `author_name`) bila siswa meminta.
- Log audit (`auth_events`) menyimpan NIS dan nama sampai 90 hari, lalu dihapus otomatis oleh pemeliharaan mingguan.

**Satu sekolah** (semua siswa, guru, kelas, jawaban, foto, dan log auditnya):
```bash
node --env-file=.env.local scripts/delete-school.mjs <KODE_SEKOLAH>                         # lihat dulu apa yang akan dihapus
node --env-file=.env.local scripts/delete-school.mjs <KODE_SEKOLAH> --confirm <KODE_SEKOLAH>
```
Tidak bisa dibatalkan. Backup mingguan masih memuat data itu sampai 30 hari, lalu hilang sendiri.

**Data uji saja:** `npm run db:purge-test`.

## 11. Sebelum siswa sungguhan mendaftar (wajib)

1. **Pisah project dev dan production** (spec 10.1, D24): buat `emodul-prod`, jalankan semua migrasi, buat admin,
   ganti env Production di Vercel, `PEPPER` baru. Project ini menjadi dev.
2. **Kunci Turnstile asli** untuk Production (`VITE_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`), lalu redeploy.
3. Supabase > Authentication > **Rate Limits**: naikkan "Verification requests" ke sekitar 300 per 5 menit dan nyalakan
   IP Address Forwarding, agar satu kelas yang masuk bersamaan dari satu IP sekolah tidak tertahan.
4. Uji manual login Google guru di `/guru` dan penebusan kode aktivasi.
5. Isi secret backup GitHub (bagian 7) dan jalankan sekali secara manual.

## 12. Batas Free tier dan tindakan

| Batas | Nilai | Bila mendekati |
|---|---|---|
| Database | 500 MB | Hapus sekolah/kelas lama (bagian 10), atau upgrade |
| Storage | 1 GB | Pemeliharaan mingguan membersihkan berkas yatim; arsipkan lalu hapus sekolah lama |
| Pause | ~7 hari tanpa aktivitas | Ping harian (bagian 1) |
| Vercel Cron Hobby | maks. sekali sehari per job, waktu ±59 menit | Cukup untuk ping; Cron Jobs akan dipindah Vercel ke "Schedules" |

## 13. Keamanan: yang sudah dan belum

Sudah: RLS di semua tabel (diuji `npm run test:rls`), rahasia tidak pernah ada di riwayat git
(`node --env-file=.env.local scripts/scan-history.mjs`), log server tanpa PIN, CAPTCHA + batas laju di daftar/masuk,
header `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, isian siswa di-escape di jendela cetak, CSV terlindung dari injeksi rumus.

Belum: Content-Security-Policy (perlu mendaftar domain Turnstile, Supabase, dan Realtime satu per satu lalu diuji),
MFA admin (D21, ditunda).
