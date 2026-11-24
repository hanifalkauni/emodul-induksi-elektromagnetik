# SPEC: Database & Sinkronisasi E-Modul (Supabase)

Status: **v12. Fase 0 selesai (2026-11-18): 6 migrasi diterapkan, 61/61 uji RLS dan sesi lulus.** Semua keputusan sudah diambil dan tidak ada pertanyaan terbuka. Siap untuk Fase 0. (belum ada kode). Diperbarui: 2026-11-18.
Cakupan: menyimpan data e-modul "Induksi Elektromagnetik" (17 screen) ke Supabase agar guru dapat memantau siswa dan kelompok, dan data tidak hilang saat browser dibersihkan.

## Log keputusan

| # | Keputusan | Sumber |
|---|---|---|
| D1 | Siswa login dengan **NIS + PIN 6 digit**. Anonymous auth untuk siswa **tidak dipakai**. | Brainstorm |
| D2 | **Daftar mandiri** (tanpa roster dari guru). Guru/admin bisa **reset PIN** dan **buka kunci**. | Brainstorm |
| D3 | **Multi-sekolah.** | Brainstorm |
| D4 | Anti-pause memakai **Vercel Cron** (aplikasi di-deploy di Vercel). | Brainstorm |
| D5 | Login siswa memakai **Opsi B**: verifikasi PIN oleh fungsi server sendiri, bukan password Supabase Auth. | Brainstorm |
| D6 | Kunci akun: **5 kali salah -> terkunci 15 menit**. Admin/guru bisa membuka kunci lebih awal. | Brainstorm |
| D7 | ~~Sekolah dibuat admin atau guru~~ **Direvisi oleh D18:** sekolah dibuat **admin** saat menerbitkan kode aktivasi guru. Guru yang kurang teknis cukup login dan menempelkan kode. | Brainstorm, direvisi |
| D8 | Sesi Supabase diterbitkan server lewat admin API (`generateLink` + `verifyOtp`), bukan JWT buatan sendiri. | **Terbukti di Fase 0** (sesi terbit, token dikenali, refresh bekerja). Opsi C tidak diperlukan. |
| D9 | Buka kunci dan reset PIN boleh dilakukan **semua guru di sekolah yang sama** (plus admin). | Keputusan |
| D10 | Pindah kelas/kelompok siswa **hanya lewat guru** (siswa tidak bisa mengubahnya sendiri). | Keputusan |
| D11 | Penggabungan data lokal vs server: **yang lebih baru menang** (aturan rinci di 6.1). | Keputusan |
| D12 | Pemilik proyek (Anda) adalah **admin pertama**. Akun admin dibuat manual dengan password kuat sejak awal (3.7, direvisi D24: tidak ada admin dummy). | Keputusan, direvisi |
| D13 | **Pengarsipan kelas/tahun ajaran ditunda** (di luar lingkup sekarang). Kolom `classes.archived` tetap ada, tanpa fitur otomatis. | Keputusan |
| D14 | **Tidak ada batas jumlah siswa** per kelas. Perlindungan spam tetap lewat CAPTCHA, batas laju per IP, dan kode kelas. | Keputusan |
| D15 | Kode kelas: **6 karakter huruf besar + angka tanpa `0/O/1/I`**, dibuat otomatis, dan guru bisa menggantinya bila bocor. | Keputusan |
| D16 | **Domain bawaan Vercel** (`*.vercel.app`) dulu. | Keputusan |
| D17 | Sekolah punya **Kode Sekolah tetap** (`schools.school_code`). Siswa **cukup memasukkan NIS + PIN**: server mencari sekolah dari NIS+PIN, dan Kode Sekolah hanya diminta bila terjadi bentrok (3.3). Kode kelas (`join_code`) hanya untuk mendaftar. | Keputusan |
| D18 | Guru **hanya aktif dengan Kode Aktivasi** yang diterbitkan admin dan dikirim ke guru di luar sistem (misalnya WhatsApp). Kode berlaku sampai kedaluwarsa dan dapat dipakai beberapa guru (D23), terikat sekolah, dan opsional terikat email guru (3.5). Tanpa kode, login Google tidak memberi akses apa pun. | Keputusan |
| D20 | Kode aktivasi guru **hanya diterbitkan admin**. Masa berlaku **dapat diatur admin** (default 14 hari, pilihan sampai 90 hari). | Keputusan |
| D21 | **Tanpa MFA** untuk admin pada tahap ini (dapat ditambah nanti). | Keputusan |
| D22 | **Ikatan email pada kode aktivasi bersifat opsional** agar admin tidak perlu mengumpulkan email guru. | Keputusan |
| D25 | Rahasia PIN disimpan di tabel terpisah **`student_secrets`** (hanya `service_role`), bukan kolom di `students`. Lebih sederhana dan lebih aman daripada mencabut hak per kolom. | Implementasi Fase 0 |
| D24 | **Satu project Supabase (`emodul`) dipakai untuk dev dan production** pada tahap pilot, supaya setup sederhana. Konsekuensi dan aturannya ada di 10.1. **Wajib dipisah menjadi `emodul-prod` sebelum siswa sungguhan memakai.** | Keputusan |
| D23 | Kode aktivasi **bisa dipakai berkali-kali sampai kedaluwarsa** (satu kode untuk banyak guru satu sekolah). Pengaman: batas jumlah pemakaian `max_uses` yang dapat diatur (default 30), log setiap penebusan, dan admin dapat mencabut kode serta menonaktifkan guru. | Keputusan |
| D19 | Login dipisah per **rute**: `/` (siswa), `/guru`, `/admin`. Otorisasi tetap diperiksa server dan RLS, bukan oleh rute (3.8). | Keputusan |

---

## 1. Apakah Supabase Free cukup?

**Cukup untuk pilot dan pemakaian beberapa sekolah kecil.** Batas ukuran bukan masalah. Risiko utamanya operasional.

Batas Free plan (menurut halaman harga Supabase dan ringkasan per Okt 2026; cek ulang di supabase.com/pricing sebelum rilis):

| Sumber daya | Batas Free | Perkiraan (500 siswa, 100 kelompok) | Aman? |
|---|---|---|---|
| Database | 500 MB | 20–50 MB | Ya |
| File storage | 1 GB | 100–150 MB (foto dikompres) | Ya, **syarat: foto tidak disimpan sebagai base64** |
| Egress | 5 GB/bulan | < 1 GB | Ya |
| Monthly active users | 50.000 | 500–1.000 | Ya |
| Project aktif | 2 | 1 | Ya |

Risiko:

1. **Pause setelah 1 minggu tanpa aktivitas.** Mitigasi: Vercel Cron harian (bagian 8) + aplikasi tetap bisa dipakai dari localStorage saat server tidak tersedia.
2. **Tidak ada backup otomatis di Free.** Mitigasi: ekspor terjadwal (`pg_dump`) dan tombol ekspor CSV untuk guru.
3. **Tanpa SLA.** Bila dipakai sebagai nilai resmi atau banyak sekolah serentak, naik ke Pro (sekitar US$25/bulan per project).
4. **Email bawaan Supabase dibatasi ketat.** Login guru memakai Google OAuth, atau pasang SMTP sendiri.

Region: Singapore (`ap-southeast-1`).

---

## 2. Tujuan dan non-tujuan

**Tujuan**
- Simpan jawaban dan progres individu per siswa.
- Data kelompok (peran, papan ide, data uji, prototipe, improve, presentasi) **dipakai bersama** anggota kelompok. Saat ini hanya ada di satu browser.
- Dashboard guru: progres siswa/kelompok, melihat jawaban, ekspor rekap, **buka kunci dan reset PIN**.
- Foto/sketsa di Storage, bukan di state.
- Mode lokal tanpa login tetap ada (demo/latihan).

**Non-tujuan (fase ini)**
- Penilaian otomatis, chat, notifikasi email, analitik lanjutan.
- Mengganti ekspor LKPD/portofolio (tetap dibuat di browser).
- Impor roster dari guru (dipilih daftar mandiri).
- Pendaftaran guru terbuka (guru hanya bisa aktif dengan kode dari admin).

---

## 3. Autentikasi dan akun

### 3.1 Aktor

| Aktor | Cara masuk | Hak utama |
|---|---|---|
| Siswa | **NIS + PIN 6 digit** di rute `/` lewat fungsi server (3.3) | Mengisi e-modul, data kelompok sendiri |
| Guru | Google OAuth di rute `/guru`, lalu **aktivasi dengan Kode Aktivasi dari admin** (3.5). Email+password hanya bila SMTP sendiri sudah ada. | Membuat kelas, memantau siswa, buka kunci, reset PIN, pindahkan siswa, nonaktifkan/hapus pendaftar |
| Admin | Email + password di rute `/admin` (tanpa MFA untuk saat ini) | Membuat sekolah dan kode aktivasi, menonaktifkan guru, menggabung sekolah, buka kunci/reset PIN di semua sekolah |

### 3.2 Identitas siswa dan pendaftaran mandiri

- NIS hanya unik **per sekolah**. Kunci unik: `(school_id, nis)`. NISN tidak dipakai.
- Pendaftaran siswa memakai **kode kelas** (`join_code`) dari guru. Dari kode itu sistem sudah tahu sekolah dan kelas, sehingga tidak ada salah pilih sekolah dan akun asing tidak bisa masuk ke kelas yang kodenya tidak diketahui.
- Form pendaftaran: kode kelas, NIS, nama, kelompok (pilih atau buat baru), PIN 6 digit + konfirmasi.
- NIS: huruf/angka, 4â€“20 karakter, dinormalisasi (spasi dibuang, huruf besar). Nama kelompok dinormalisasi tanpa membedakan huruf besar/kecil agar "Kelompok 3" dan "kelompok 3" tidak menjadi dua kelompok.
- **Kode Sekolah (D17):** kode tetap 6 karakter (tidak berubah seperti kode kelas, hanya admin yang dapat mengganti). Dipakai untuk membedakan sekolah bila NIS dan PIN yang sama muncul di lebih dari satu sekolah. Siswa **tidak perlu mengetiknya** dalam keadaan normal: ditampilkan setelah mendaftar, diingat perangkat, dan tercantum di kartu login yang bisa dicetak guru.
- Karena tidak ada roster, NIS **tidak bisa diverifikasi** terhadap data sekolah. Dampak yang diterima: orang yang memegang kode kelas bisa mendaftar dengan NIS milik orang lain yang belum mendaftar. Mitigasi: satu `(school_id, nis)` hanya bisa didaftarkan sekali, guru melihat daftar pendaftar kelasnya dan dapat menghapus/mereset akun yang janggal. Bila ini menjadi masalah nyata, tambahkan impor roster di fase berikutnya.
- Aturan PIN: tepat 6 digit. Tolak PIN yang terlalu mudah (`000000`, `123456`, semua digit sama, urutan naik/turun, atau sama dengan 6 digit NIS). **Pendaftaran tidak boleh menolak PIN karena "sudah dipakai akun lain ber-NIS sama"**, karena itu menjadi celah untuk menebak PIN akun sekolah lain.

### 3.3 Alur (semua lewat Vercel Functions)

Klien tidak memanggil Supabase Auth langsung untuk siswa. Pendaftaran terbuka di Supabase Auth dimatikan. Fungsi server memakai `service_role` (hanya ada di environment variable Vercel).

| Endpoint | Fungsi |
|---|---|
| `POST /api/auth/register` | Siswa: validasi CAPTCHA, kode kelas, NIS belum terpakai di sekolah itu, aturan PIN. Buat user Auth internal + baris `students`. Terbitkan sesi. |
| `POST /api/auth/login` | Siswa: cari akun dari NIS (+ kode sekolah bila ada), cek kunci, verifikasi PIN, catat percobaan, terbitkan sesi. |
| `POST /api/auth/change-pin` | Siswa: ganti PIN (butuh PIN lama, atau sesi dengan `must_change_pin`). |
| `POST /api/teacher/activate` | Guru: menebus Kode Aktivasi (3.5). |
| `POST /api/teacher/unlock` | Buka kunci siswa (guru aktif sekolah itu atau admin). |
| `POST /api/teacher/reset-pin` | PIN sementara acak, `must_change_pin = true`, buka kunci. PIN hanya tampil sekali ke guru. |
| `POST /api/teacher/move-student` | Pindahkan siswa ke kelas/kelompok lain di sekolah yang sama. |
| `POST /api/teacher/disable-student` | Nonaktifkan atau hapus akun pendaftar (mencabut sesi). Koreksi NIS juga lewat sini dan otomatis mereset PIN. |
| `POST /api/teacher/rotate-join-code` | Ganti kode kelas (D15). |
| `POST /api/admin/invites` | Admin menerbitkan Kode Aktivasi Guru (3.5). |
| `POST /api/admin/invites/revoke` | Admin mencabut kode (guru yang sudah aktif tidak otomatis keluar). |
| `POST /api/admin/teachers/disable` | Admin menonaktifkan guru (mencabut sesi). |
| `POST /api/admin/schools` | Admin membuat/mengubah/menggabung sekolah, mengganti Kode Sekolah. |
| `GET /api/ping` | Dipanggil Vercel Cron (bagian 8). |

Semua endpoint `teacher/*` dan `admin/*` memverifikasi token Supabase milik pemanggil, membaca `profiles` (peran dan `status = 'active'`), lalu memeriksa kepemilikan sekolah di **server**, tidak percaya data dari klien.

**Login siswa (D17): cukup NIS + PIN**
1. Klien kirim `{nis, pin, captcha_token, kode_sekolah?}`. `kode_sekolah` terisi otomatis bila perangkat sudah mengingatnya.
2. Server memeriksa batas laju per IP dan CAPTCHA.
3. Kandidat akun: bila `kode_sekolah` ada, hanya akun `(sekolah itu, nis)`. Bila tidak ada, semua akun aktif ber-NIS itu di semua sekolah. Bila kandidat **lebih dari 5**, server membalas "Masukkan Kode Sekolah" tanpa memeriksa PIN (mencegah beban hash berlebihan dan melebarnya ruang tebakan).
4. Tidak ada kandidat: tetap menghitung hash palsu agar waktu respons sama dan balas **pesan galat yang sama** ("NIS atau PIN salah").
5. Buang kandidat yang sedang terkunci (`locked_until > now()`). Bila semua terkunci: "Akun terkunci, coba lagi nanti atau minta guru membukanya".
6. Verifikasi PIN pada tiap kandidat (hash terikat `school_id:nis:pin`, jadi tidak bocor bahwa dua sekolah memakai PIN yang sama):
   - **Tepat satu cocok** -> sukses: `failed_attempts = 0`, `last_login_at = now()`.
   - **Lebih dari satu cocok** (NIS dan PIN sama di dua sekolah) -> tidak login, balas "Masukkan Kode Sekolah", lalu ulangi dengan kode.
   - **Tidak ada cocok** -> `failed_attempts += 1` pada kandidat yang diperiksa. Mencapai 5: `locked_until = now() + 15 menit`, catat peristiwa `locked`.
7. Sukses: terbitkan sesi (3.4). Jika `must_change_pin`, klien dipaksa ke layar ganti PIN.

Konsekuensi yang diterima: satu tebakan PIN menguji semua akun ber-NIS sama sekaligus, jadi di NIS pendek yang umum (misal `1001`) peluang tebakan naik sebanding jumlah sekolah. Batas 5 kandidat, kunci per akun, CAPTCHA, dan batas laju IP membatasi dampaknya. Hitungan kunci per akun dapat dimanfaatkan orang iseng untuk mengunci akun orang lain; guru bisa membukanya (D6).
### 3.4 Penerbitan sesi (D8)

Fungsi server memverifikasi PIN dengan hash sendiri. Supabase Auth hanya dipakai sebagai "wadah sesi" agar RLS (`auth.uid()`), Realtime, dan Storage tetap bekerja dari klien.

- Setiap siswa punya satu user Auth internal dengan email sintetis acak `{uuid_acak}@siswa.emodul.invalid` tanpa password yang bisa dipakai. `students.id` diisi dengan id user yang dikembalikan Supabase saat user dibuat.
- Setelah PIN benar, server memanggil `auth.admin.generateLink({ type: 'magiclink', email })`, lalu `auth.verifyOtp({ token_hash, type: 'magiclink' })` di sisi server, dan mengirim `access_token` + `refresh_token` ke klien (`supabase.auth.setSession`).
- Refresh token berikutnya ditangani supabase-js seperti biasa (tidak perlu PIN lagi sampai sesi dicabut).
- Penutup: pendaftaran terbuka dimatikan, email konfirmasi tidak relevan (domain `.invalid` tidak bisa menerima email), dan klien tidak punya cara masuk tanpa fungsi server.
- **Risiko:** perilaku API ini perlu diuji di Fase 0 (termasuk setelah pembaruan Supabase). Cadangan bila tidak berjalan: Opsi C (password Supabase = HMAC dari PIN dengan rahasia server) yang memberi sesi lewat `signInWithPassword` dari server. Tidak memakai JWT buatan sendiri karena rapuh terhadap perubahan kunci penandatangan Supabase.
- Pencabutan: guru/admin menonaktifkan siswa -> `auth.admin.signOut` / hapus sesi, dan `students.status = 'disabled'`.

### 3.5 Aktivasi guru dan pembuatan sekolah (D7, D18)

Tidak ada pendaftaran guru terbuka. Login Google saja tidak memberi akses apa pun: akun tanpa profil aktif hanya melihat layar "Masukkan Kode Aktivasi".

**Menerbitkan kode (admin, rute `/admin`)**
- Admin memilih salah satu:
  - **Sekolah yang sudah ada**, atau
  - **Sekolah baru**: admin mengisi nama sekolah, kota, NPSN (opsional). Sekolah dibuat saat kode ditebus.
- Opsional: **email Google guru**. Bila diisi, kode hanya bisa ditebus oleh akun Google dengan email itu (praktis kode untuk satu orang). Bila dikosongkan, **siapa pun yang memegang kode dan login Google dapat menjadi guru sampai kode kedaluwarsa atau dicabut**; panel admin menampilkan **peringatan** jika email kosong dan masa berlaku lebih dari 7 hari.
- **Dapat dipakai berkali-kali (D23):** satu kode dibagikan ke beberapa guru di sekolah yang sama. Batas pemakaian `max_uses` (default 30, admin bisa mengubah atau memilih tanpa batas). Setelah batas tercapai atau kedaluwarsa, kode ditolak.
- Masa berlaku **diatur admin saat menerbitkan** (D20): pilihan 3, 7, 14, 30, 60, atau 90 hari, default 14 hari. Panel menampilkan sisa waktu dan jumlah pemakaian, dan admin dapat mencabut atau memperpanjang kode kapan saja. Format 10 karakter dari 32 simbol tanpa `0/O/1/I` (sekitar 50 bit). Kode ditampilkan sekali; database hanya menyimpan hash.
- Admin mengirim kode ke guru **di luar sistem** (WhatsApp dan sejenisnya).

**Menebus kode (guru, rute `/guru`)**
1. Guru login Google, lalu menempelkan kode di layar aktivasi.
2. `POST /api/teacher/activate` memeriksa: hash cocok, belum kedaluwarsa, belum dicabut, `use_count < max_uses`, email cocok bila terikat, dan akun itu belum menjadi guru di sekolah lain (satu guru satu sekolah). Bila akun sudah aktif di sekolah yang sama, penebusan ulang tidak menambah hitungan. Batas percobaan salah: 5 per jam per akun dan per IP.
3. Berhasil: server membuat baris `profiles` (`role = 'teacher'`, `status = 'active'`, `school_id`), menambah `use_count` dan mencatat satu baris di `teacher_invite_redemptions` (email, waktu), dan (bila sekolah baru) membuat sekolah dengan `school_code` otomatis.
4. Guru lalu membuat kelas sendiri dan mendapat kode kelas.

**Kontrol admin**
- Panel `/admin` menampilkan undangan, **daftar semua yang sudah menebus (email Google dan waktunya)**, dan sisa pemakaian. Guru baru ditandai "Baru" sampai admin melihatnya. Bila ada yang tidak dikenal: admin menonaktifkan guru itu, **mencabut kode** (guru yang sudah aktif tidak otomatis keluar, harus dinonaktifkan satu per satu), lalu menerbitkan kode baru.
- Guru lain di sekolah yang sama juga perlu kode; **hanya admin yang menerbitkan** (D20). Guru aktif tidak bisa menerbitkan kode.
- Duplikat sekolah terkendali karena hanya admin yang membuat sekolah. NPSN unik; admin dapat menggabung sekolah.
- Guru yang kurang teknis: admin menyiapkan sekolah dan kodenya, guru hanya login Google dan menempel kode.

**Wewenang guru aktif (D9, D10)**
- Buka kunci / reset PIN: semua guru aktif di sekolah yang sama, dan admin. Dicatat di `auth_events` (siapa, siapa yang dibuka, kapan). Guru sekolah lain tidak punya akses.
- Pindah kelas/kelompok: siswa memilih kelompok hanya saat mendaftar. Setelahnya `class_id` dan `group_id` hanya bisa diubah guru sekolah itu lewat `POST /api/teacher/move-student`. Klien siswa tidak punya hak `UPDATE` pada kolom itu, dan perubahan dicatat di `auth_events`. Data jawaban siswa ikut pindah; data kelompok lama tetap di kelompok lama.
- Satu guru satu sekolah pada fase ini.
### 3.6 Keamanan PIN (lihat juga 3.7 untuk akun admin)

- PIN 6 digit hanya 1 juta kemungkinan. Kalau hash bocor, bisa ditebak habis dalam hitungan detik meski hash-nya kuat. Karena itu:
  - `pin_hash = scrypt(HMAC-SHA256(PEPPER, school_id:nis:pin), salt)` (scrypt dari `node:crypto`, tanpa dependensi).
  - `PEPPER` hanya di environment variable Vercel, tidak pernah di database. Kebocoran database saja tidak cukup untuk menebak PIN.
  - Karena NIS ikut dalam hash, koreksi NIS oleh guru otomatis mereset PIN.
  - Rotasi/kehilangan `PEPPER` berarti semua PIN harus direset. Tulis prosedurnya di runbook.
- Perlindungan tambahan: CAPTCHA (Cloudflare Turnstile, gratis) pada daftar dan login, batas laju per IP, kunci 5x salah/15 menit per akun.
- PIN tidak pernah dicatat di log, tidak dikirim lewat URL, hanya lewat body HTTPS.

### 3.7 Akun admin awal (D12, D24)

Admin memakai Supabase Auth email + password biasa (bukan alur NIS/PIN), dengan `profiles.role = 'admin'`.

Karena dev dan production memakai satu project (D24), **tidak ada akun admin dummy**. Kredensial dummy di repo akan menjadi akses admin ke data nyata.

- Admin dibuat sekali lewat dashboard Supabase (Authentication > Users) dengan email asli Anda dan password panjang acak dari password manager (tanpa `email_confirm` palsu), lalu `profiles.role` diatur ke `admin` dengan satu perintah SQL. Password tidak masuk repo atau dokumen.
- Skrip seed **tidak membuat akun admin** dan tidak menyentuh `auth.users` milik staf.
- Admin tambahan: ditambahkan manual oleh admin yang ada (ubah `profiles.role` lewat SQL). Peran `admin` tidak pernah bisa didapat lewat kode aktivasi atau dari klien.
- Login admin lewat rute `/admin` (email + password, CAPTCHA, batas laju). **Tanpa MFA untuk saat ini (D21)**; gunakan password panjang acak dan jangan dibagikan. MFA (TOTP) dapat diaktifkan kapan saja di Supabase tanpa mengubah desain.
- Untuk menguji alur guru/admin selama pengembangan, gunakan **akun Google Anda sendiri** sebagai guru uji (kode aktivasi diterbitkan ke sekolah uji, 10.1), bukan akun dummy.

---
### 3.8 Rute dan pemisahan login (D19)

| Rute | Pengguna | Isi |
|---|---|---|
| `/` | Siswa | E-modul, daftar, login NIS + PIN. Mode lokal tanpa login tetap ada. |
| `/guru` | Guru | Login Google, aktivasi kode, dashboard guru |
| `/admin` | Admin | Login email+password, panel admin (kode aktivasi, sekolah, guru) |

Catatan:
- **Rute bukan pengaman.** Menyembunyikan atau memisahkan URL hanya memudahkan penggunaan. Hak akses ditentukan oleh peran di `profiles`, diperiksa di setiap fungsi server dan oleh RLS. Guru yang membuka `/admin` ditolak server (403) meski halamannya terbuka.
- `/admin` tidak ditautkan dari antarmuka publik, memakai CAPTCHA dan batas laju.
- Bundel JavaScript guru dan admin dimuat terpisah (lazy-load) agar halaman siswa tetap ringan.
- **Sesi terpisah:** klien Supabase siswa dan staf memakai `storageKey` berbeda (misal `emodul-student-auth` dan `emodul-staff-auth`). Tanpa itu, guru yang mencoba login siswa di browser yang sama akan menimpa sesi gurunya.
- Aplikasi sekarang belum memakai router (layar diatur lewat state). Perlu routing berbasis path (React Router atau pengalihan `pathname` sederhana). `vercel.json` sudah mengarahkan semua path ke `index.html` kecuali `/api`.

---

## 4. Model data

Prinsip: kolom nyata untuk yang di-query guru, `jsonb` untuk isian bebas yang bentuknya mengikuti `EModulState`.

### 4.1 Tabel

```
schools         (id pk, name, school_code unique, npsn unique null, city, is_test bool default false, status 'active'|'merged', created_by, created_at)
profiles        (user_id pk -> auth.users, role 'teacher'|'admin', status 'active'|'disabled',
                 display_name, school_id -> schools, created_at)
                -- baris dibuat server saat aktivasi; tanpa baris = tanpa akses
teacher_invites (id pk, code_hash, school_id null, new_school_name null, new_school_city null, new_school_npsn null,
                 bound_email null, created_by -> profiles, expires_at, max_uses int null, use_count int default 0,
                 revoked bool, created_at)    -- tidak dapat diakses klien
teacher_invite_redemptions (id pk, invite_id -> teacher_invites, user_id -> profiles, email, redeemed_at)
                -- hanya guru/admin; siswa tidak punya baris di sini
classes         (id pk, school_id, teacher_id -> profiles, name, join_code unique, created_at, archived bool)
groups          (id pk, class_id, name, unique(class_id, name))

-- index tambahan: students(nis) untuk pencarian login tanpa kode sekolah
students        (id pk = auth.users.id, school_id, class_id, group_id, nis, student_name,
                 must_change_pin bool, locked_until timestamptz null, last_login_at,
                 status 'active'|'disabled', created_at, unique(school_id, nis))
student_secrets (student_id pk -> students, pin_hash, pin_salt, failed_attempts int, updated_at)
                -- D25: tanpa grant ke klien sama sekali, hanya service_role

auth_events     (id pk, school_id, student_id null, nis, actor_id null, ip_hash,
                 event 'register'|'login_ok'|'login_fail'|'locked'|'unlock'|'reset_pin'|'change_pin'|'disabled'|'move'|'teacher_activate'|'invite_create'|'invite_revoke',
                 created_at)            -- retensi 90 hari, dibersihkan cron

student_state   (student_id pk, current_screen int, visited_screens int[], completion_percent int,
                 data jsonb, updated_at)
group_state     (group_id pk, data jsonb, data_meta jsonb, updated_at)   -- data_meta: kunci -> waktu ubah server
group_roles     (group_id, role, member_name, task_description, member_id, pk(group_id, role))
ideas           (id pk, group_id, author_id, author_name, title, drive_mechanism, description, color, created_at)
idea_votes      (idea_id, voter_id, pk(idea_id, voter_id))
test_trials     (id pk, group_id, sort_order, trial_label, voltage, turns, speed,
                 magnet_condition, led_lit, updated_at)
files           (id pk, group_id, kind 'process_photo'|'prototype_photo'|'design_sketch'|'lab_report',
                 storage_path, file_name, size_bytes, uploaded_by, created_at)

teacher_feedback (id pk, class_id, student_id null, group_id null, teacher_id, score numeric null,
                  comment, created_at)               -- belum masuk fase 0-6 (umpan balik guru, ditunda)
```

`students` menggantikan `enrollments` pada draft v1. Hash dan salt PIN serta hitungan gagal ada di `student_secrets` (D25), yang tidak bisa dibaca klien mana pun. `locked_until` tetap di `students` agar guru bisa melihat status kunci; klien tidak punya hak `UPDATE` atas tabel `students`.

Tambahan dari implementasi:
- `groups.name_key` (kolom turunan, huruf kecil dan spasi dinormalisasi) unik per kelas, sehingga "Kelompok 3" dan "kelompok  3" tidak bisa menjadi dua kelompok.
- Setiap kelompok baru otomatis mendapat baris `group_state` (trigger).
- Batas ukuran: `student_state.data` dan `group_state.data` maks. 256 KB, `patch_group_state` maks. 64 KB per panggilan, sehingga satu akun tidak bisa menghabiskan kuota database.
- View `v_group_members` (nama dan id anggota kelompok sendiri, tanpa NIS) untuk dropdown peran dan nama pengusul ide. Sengaja berjalan dengan hak pemilik dan difilter ke kelompok pemanggil; Security Advisor Supabase akan menandainya sebagai "security definer view", dan itu disengaja.

### 4.2 Pemetaan `EModulState` -> tabel

| Field state | Tujuan |
|---|---|
| `currentScreen`, `visitedScreens` | `student_state` kolom |
| `identity.studentName`, `studentClass`, `groupName`, `schoolName` | `students`, `groups`, `schools` (terisi saat daftar) |
| `checkedObjectives`, `initialHypothesis`, `guidingAnswers`, `flux*`, `faraday*`, `lenz*`, `creativityScores`, `collaborationScores`, `bestContributionText`, `futureImprovementText`, `googleFormUrl` | `student_state.data` |
| `roles` | `group_roles` |
| `checkedTools`, `experimentStrategy`, `labReportLink`, `checkedConstraints`, `finalSelectedIdea`, `driveSyncRecorded`, `design*` (teks), `testVideoLink`, `lmsUploadLink`, `designSuccessStatus`, `failureCauseAnalysis`, `improve*`, `presentationPoints`, `presentationSlideLink` | `group_state.data` |
| `ideas` | `ideas` + `idea_votes` |
| `testingRows` | `test_trials` |
| `designSketchDataUrl`, `processPhotoUrl`, `prototypePhotoUrl`, `labReportFileName` | `files` + Storage (bukan base64) |
| `lastSavedAt` | `updated_at` |

Bagian "Identitas" di Screen 1 berubah: dari form bebas menjadi **layar daftar/login** (kode kelas, NIS, PIN). Mode lokal tetap memakai form lama.

### 4.3 Konkurensi data kelompok

Jangan menimpa seluruh jsonb. Pakai RPC yang menggabung per kunci:

```sql
create function patch_group_state(p_group uuid, p_patch jsonb) returns void
language sql security invoker as $$
  update group_state
     set data       = data || p_patch,
         data_meta  = data_meta || coalesce(
                        (select jsonb_object_agg(k, to_jsonb(now())) from jsonb_object_keys(p_patch) k),
                        '{}'::jsonb),
         updated_at = now()
   where group_id = p_group;
$$;
```

Aturan: last-write-wins per kunci. `data_meta` mencatat waktu server tiap kunci yang diubah. RPC menerapkan patch apa adanya; keputusan "lokal atau server yang menang" diambil klien lebih dulu (6.1) dengan membandingkan `data_meta`, sehingga hanya kunci yang menang yang dikirim. `ideas` dan `test_trials` sudah baris terpisah sehingga tidak bentrok.

---

## 5. Keamanan data (RLS)

Semua tabel `enable row level security`. Tidak ada akses tanpa policy. Operasi akun (daftar, login, ganti PIN, buka kunci, reset PIN) **hanya** lewat Vercel Functions dengan `service_role`.

Fungsi bantu (`security definer`, `set search_path = ''`) ada di schema **`private`** agar tidak terekspos sebagai RPC lewat Data API: `is_admin`, `is_teacher_of_school`, `is_staff_of_school`, `is_group_member`, `is_staff_of_group`, `can_access_group`, `current_school_id`, `my_class_id`, `my_group_id`, dan beberapa pencari `*_school_id`.

Hak akses ditulis eksplisit (auto-grant tabel baru dimatikan di project): mulai dari `revoke all`, lalu `grant` minimum per tabel dan sering per kolom (misalnya siswa hanya boleh menulis `current_screen`, `visited_screens`, `completion_percent`, `data` di `student_state`). Klien hanya boleh memanggil RPC `patch_group_state`; `ping()` hanya untuk `service_role`.

| Tabel | Siswa | Guru | Admin |
|---|---|---|---|
| `schools` | baca sekolah sendiri | baca/ubah sekolah sendiri | semua |
| `classes`, `groups` | baca milik sendiri | CRUD kelasnya | semua |
| `students` | baca baris sendiri **tanpa kolom PIN/kunci** | baca siswa sekolahnya (tanpa kolom PIN) | semua |
| `auth_events` | tidak ada | baca di sekolahnya | semua |
| `teacher_invites` | tidak ada | tidak ada | lewat endpoint admin (service) |
| `student_state` | baca/tulis **milik sendiri** | baca (sekolahnya) | semua |
| `group_state`, `group_roles`, `test_trials`, `files` | baca/tulis bila anggota kelompok | baca (sekolahnya) | semua |
| `ideas` | baca/tambah bila anggota; hapus milik sendiri | baca/hapus | semua |
| `idea_votes` | tambah/hapus milik sendiri | baca | semua |
| `teacher_feedback` | baca yang ditujukan kepadanya | CRUD miliknya | semua |

**Storage**: bucket privat `emodul-uploads`, path `{school_id}/{class_id}/{group_id}/{kind}-{uuid}.jpg`. Akses hanya anggota kelompok, guru sekolah itu, dan admin. Tampilkan lewat signed URL berumur pendek. Maks. 2 MB per berkas; hanya `image/*` dan `application/pdf`.

Kunci `anon` dan URL project boleh ada di frontend. **`service_role` dan `PEPPER` hanya di environment variable Vercel**, tidak di repo.

Privasi: data anak sekolah (NIS, nama, jawaban). Simpan seminimal mungkin, tanpa email siswa. Sediakan prosedur hapus data per siswa/sekolah dan pemberitahuan penggunaan data (UU PDP). Pengarsipan per tahun ajaran ditunda (D13).
Pengguna tanpa baris `profiles` aktif (misalnya akun Google yang belum menebus kode, atau guru yang dinonaktifkan) tidak lolos `is_teacher_of_school` / `is_teacher_of_class`, sehingga tidak bisa membaca data siswa (D18). Tabel `teacher_invites` hanya dapat diakses `service_role`.

---

## 6. Strategi sinkronisasi di aplikasi

Aplikasi tetap **local-first**:

1. `ModulContext` tetap memakai localStorage sebagai cache dan satu-satunya sumber di mode lokal.
2. Setelah login, perubahan disinkron dengan **debounce 1,5 detik**: bagian individu -> upsert `student_state`; bagian kelompok -> `patch_group_state`; ide/vote/baris uji -> operasi baris.
3. Saat membuka aplikasi / setelah login: ambil data server, lalu gabungkan dengan data lokal sesuai aturan 6.1.
4. Gagal jaringan atau project di-pause: tampilkan "Belum tersinkron", antrekan perubahan, ulang dengan backoff. Login butuh server; sesi yang sudah ada tetap bisa dipakai offline.
5. **Realtime** hanya untuk `ideas`, `idea_votes`, `group_state`. Batas koneksi bersamaan di Free terbatas (cek dashboard); fallback polling 10 detik.
6. Foto: kompres di browser (sisi maks. 1280 px, kualitas ~0,8, target <= 300 KB) lalu unggah ke Storage.

### 6.1 Aturan penggabungan lokal vs server (D11)

Aturan dasar sesuai keputusan: **waktu terakhir diubah yang lebih baru menang**. Bila waktu lokal lebih baru dari waktu data di server, pakai data lokal (lalu kirim ke server). Bila lebih lama, pakai data server.

Penyempurnaan agar aturan ini aman:

1. **Pemilik data lokal.** Data lokal diberi cap `ownerId` (id siswa). Bila yang login berbeda dari `ownerId` (misalnya komputer lab dipakai bergantian), data lokal **tidak dipakai dan tidak digabung** ke akun yang baru. Data lokal siswa sebelumnya dibuang saat logout. Tanpa ini, jawaban satu siswa bisa tertimpa atau bocor ke siswa lain. Data mode lokal tanpa login (belum punya pemilik) ditawarkan untuk diimpor sekali saat pertama kali login, dengan konfirmasi.
2. **Jam perangkat bisa salah.** Waktu server selalu dicatat server (`updated_at = now()`). Klien menyimpan `lastServerUpdatedAt` dari sinkron terakhir yang sukses dan penanda `dirty` (ada perubahan sejak sinkron terakhir). Perbandingan: data lokal menang bila `dirty` **dan** waktu perubahan lokal > `lastServerUpdatedAt`; selain itu server menang. Jadi jam HP yang salah tidak bisa menimpa data server yang lebih baru tanpa ada perubahan nyata.
3. **Satuan perbandingan.**
   - `student_state` (data pribadi): satu dokumen, pemenang ditentukan untuk seluruh dokumen.
   - `group_state` (data bersama): dibandingkan **per kunci** memakai kolom `data_meta` (peta kunci -> waktu ubah di server) dan catatan waktu ubah lokal per kunci (`localMeta`). Ini mencegah data lokal yang lebih baru di satu kolom menimpa isian teman yang lebih baru di kolom lain.
   - `ideas`, `test_trials`: baris terpisah, tidak digabung (tambah/ubah/hapus baris).
4. **Konflik nyata** (kedua sisi berubah sejak sinkron terakhir): tetap berlaku "yang lebih baru menang", dan salinan versi yang kalah disimpan di localStorage (`backup_before_merge`) selama 7 hari agar bisa dipulihkan bila siswa merasa jawabannya hilang.
5. Setelah menggabungkan, hasilnya ditulis ke lokal dan server, dan indikator sinkron menampilkan "Tersinkron".

Perubahan kode yang diperkirakan:
- `@supabase/supabase-js`, `src/lib/supabase.ts`, `src/lib/sync.ts`, `src/lib/authApi.ts`.
- Folder `api/` (Vercel Functions) untuk bagian 3.3.
- Layar daftar/login (menggantikan form identitas Screen 1 di mode online), layar ganti PIN, indikator sinkron di `AppShell`.
- Routing berbasis path (`/`, `/guru`, `/admin`) dengan klien Supabase terpisah per area (3.8).
- Screen 11–14 membaca/menulis tabel kelompok; Screen 12–13 memakai Storage.
- Halaman guru `/guru` (login Google, aktivasi kode): daftar siswa dengan status kunci, tombol **Buka kunci**, **Reset PIN**, dan **Pindahkan kelompok/kelas**, progres, jawaban, ekspor CSV.
- `vercel.json`: tambah `crons`, dan **kecualikan `/api/*` dari rewrite ke `index.html`** (aturan sekarang menangkap semua path).

---

## 7. Dashboard guru (Fase 5; panel admin minimal di Fase 2)

- Daftar siswa: nama, NIS, kelompok, `completion_percent`, layar terakhir, terakhir login, **status (aktif / terkunci sampai jam ...)**.
- Aksi per siswa: **Buka kunci**, **Reset PIN** (menampilkan PIN sementara sekali), **Pindahkan kelompok/kelas**, **Nonaktifkan**.
- View SQL (`security_invoker = on`): `v_class_progress`, `v_group_summary` (jumlah ide per anggota, baris uji, status desain, ada/tidaknya foto).
- Ekspor CSV.
- Antarmuka dirancang sederhana (satu layar, tombol besar, teks jelas) karena sebagian guru kurang terbiasa dengan aplikasi web.
- Kartu login siswa yang bisa dicetak: Kode Sekolah, kode kelas, dan petunjuk singkat.

### 7.1 Panel admin (`/admin`)

- **Kode aktivasi guru:** buat (pilih sekolah ada/baru, email opsional, masa berlaku, batas pemakaian), lihat status (jumlah pemakaian, daftar penebus, kedaluwarsa), cabut, perpanjang.
- **Guru:** daftar per sekolah, status aktif/nonaktif, nonaktifkan.
- **Sekolah:** daftar, ubah data, ganti Kode Sekolah, gabung duplikat.
- **Bantuan siswa:** cari siswa lintas sekolah, buka kunci, reset PIN.
- Jejak audit dari `auth_events`.

---

## 8. Anti-pause dan backup

- **Vercel Cron** harian memanggil `GET /api/ping`. Di Hobby, batasnya per cron job: sampai 100 job per project, masing-masing maksimal sekali per hari, dengan ketepatan waktu sekitar satu jam (bukan batas per akun, dan job di project lain tidak mengurangi jatah). Sekali sehari cukup untuk batas pause 7 hari. Dokumentasi Vercel menyebut Cron Jobs akan dipindah ke "Schedules"; cek ulang saat Fase 6.
- `/api/ping` menjalankan query kecil ke Supabase (RPC `ping()`), dilindungi header `Authorization: Bearer $CRON_SECRET`.
- Cron kedua (mingguan): `/api/maintenance` menghapus `auth_events` yang lebih dari 90 hari dan memicu ekspor/backup. `pg_dump` penuh lebih cocok di GitHub Actions karena durasinya bisa melebihi batas fungsi Vercel Hobby. Pilih salah satu saat fase 6.
- Catatan: kriteria pasti "tidak aktif" Supabase tidak terdokumentasi rinci. Pastikan ping benar-benar memakai API (bukan hanya `pg_cron` di dalam database) dan pantau di dashboard beberapa minggu.
- Ini mitigasi, bukan jaminan. Layanan bisa mengubah kebijakan Free kapan saja.

---

## 9. Perkiraan ukuran data

- `student_state.data` tanpa gambar: sekitar 8–20 KB per siswa.
- `group_state.data`: sekitar 5–15 KB per kelompok.
- `ideas`: sekitar 1 KB per ide, 10–30 ide per kelompok.
- `test_trials`: sekitar 0,3 KB per baris.
- `auth_events`: sekitar 0,2 KB per peristiwa; 500 siswa x 20 login = sekitar 2 MB per bulan, dibersihkan tiap 90 hari.
- Foto: 3–4 berkas x ~300 KB = sekitar 1,2 MB per kelompok.

Total untuk 500 siswa dan 100 kelompok: database sekitar 20–50 MB, Storage sekitar 120 MB.

---

## 10. Fase pengerjaan

Ada **7 fase (Fase 0 sampai 6)**. Urutan mengikuti ketergantungan: fondasi, siswa, guru/admin, data kelompok, foto, dashboard, operasional. Setiap fase menghasilkan sesuatu yang bisa diuji sendiri. Tanda `[ ]` adalah daftar tugas yang dicentang saat dikerjakan.

### 10.0 Ringkasan

| Fase | Fokus | Ukuran | Bergantung pada |
|---|---|---|---|
| 0 | Fondasi backend: skema, RLS, Storage, uji sesi | Sedang | - |
| 1 | Siswa daftar, login, dan data tersimpan | Besar | 0 |
| 2 | Guru dan admin: kode aktivasi, kelas, buka kunci, reset PIN | Besar | 0, 1 |
| 3 | Data kelompok dan kolaborasi | Sedang-besar | 2 |
| 4 | Foto dan sketsa ke Storage | Sedang | 2 |
| 5 | Dashboard guru lengkap | Sedang | 2, 3 (4 untuk status foto) |
| 6 | Operasional: cron, backup, runbook | Kecil-sedang | 0 (idealnya setelah 5) |

Catatan urutan:
- Fase 0 harus lebih dulu. Hasil ujinya menentukan apakah desain sesi (D8) dipakai atau diganti cadangan (Opsi C).
- Fase 1 bisa jalan tanpa Fase 2 karena sekolah dan kelas uji dibuat lewat seed. Aplikasi baru benar-benar bisa dipakai di kelas setelah Fase 2.
- Fase 3, 4, dan 5 relatif saling lepas setelah Fase 2, jadi urutannya bisa ditukar sesuai prioritas.
- **Jalur pilot cepat:** Fase 0, 1, 2 sudah cukup untuk pilot kecil. Foto sementara tetap base64, hanya aman untuk jumlah kecil karena memakan kuota (bagian 1).
- Setiap fase ditutup dengan: build lolos, uji manual sesuai kriteria selesai, dan commit terpisah per fase.

### Fase 0: Fondasi backend (SELESAI 2026-11-18)

**Tujuan:** backend siap dan risiko terbesar (D8, penerbitan sesi) terjawab sebelum UI dibangun.

Tugas:
- [x] Buat **satu** project Supabase `emodul` region Singapore (`ap-southeast-1`) (D24); matikan pendaftaran terbuka di Auth.
- [x] Siapkan Supabase CLI dan folder `supabase/migrations/` dengan file SQL berurutan.
- [x] Migrasi semua tabel bagian 4.1 beserta kunci unik dan indeks (termasuk `students(nis)`).
- [x] RLS di semua tabel, fungsi bantu di schema `private`, policy sesuai bagian 5, GRANT eksplisit.
- [x] Rahasia PIN dipisah ke `student_secrets` (D25), menggantikan pencabutan hak per kolom.
- [x] RPC `patch_group_state` (dengan `data_meta`) dan `ping()`.
- [x] Storage: bucket privat `emodul-uploads` dengan policy per kelompok, batas 2 MB, jenis berkas dibatasi.
- [x] Seed data uji (sekolah `is_test`, satu kelas, satu kelompok; tanpa akun) dan skrip pembersih.
- [x] Uji **sesi D8**: lulus.
- [x] Uji **RLS** per peran: lulus.

**Hasil:** 61/61 uji lulus (`npm run test:rls`). Ringkasan yang terbukti:
- Sesi siswa terbit lewat `generateLink` + `verifyOtp`, token dikenali, refresh bekerja.
- Siswa hanya membaca dan menulis datanya sendiri; tidak bisa membaca `student_secrets` atau `teacher_invites`, memindah kelompok, membuka kunci, atau menjadikan diri guru.
- Data kelompok hanya terlihat dan bisa diubah anggotanya; satu vote per siswa per ide.
- Guru hanya melihat siswa sekolahnya, tidak bisa mengubah jawaban siswa, tidak bisa membuat kelas di sekolah lain atau menaikkan perannya.
- Akun Google tanpa kode aktivasi dan pengunjung anonim tidak melihat data apa pun.
- Storage: unggah hanya ke folder kelompok sendiri, segmen sekolah di path tidak bisa dipalsukan, jenis berkas dibatasi, akses unduh terbatas pada kelompok dan guru sekolah itu.

**Berkas:**

| Berkas | Isi |
|---|---|
| `supabase/migrations/20261118000001_helpers.sql` | Schema `private`, pembuat kode acak, pembantu |
| `supabase/migrations/20261118000002_core_tables.sql` | Sekolah, profil staf, kelas, kelompok, siswa, `student_secrets`, audit, undangan guru |
| `supabase/migrations/20261118000003_state_tables.sql` | Data individu dan kelompok |
| `supabase/migrations/20261118000004_rpc_triggers_realtime.sql` | Trigger, `patch_group_state`, `ping`, Realtime |
| `supabase/migrations/20261118000005_access_control.sql` | Fungsi bantu RLS, GRANT, policy, `v_group_members` |
| `supabase/migrations/20261118000006_storage.sql` | Bucket dan policy Storage |
| `scripts/db.mjs` | Pembungkus CLI (`npm run db:dry`, `db:push`, `db:list`) |
| `scripts/test-rls.mjs` | Uji sesi + RLS; membuat lalu menghapus data uji (`npm run test:rls`) |
| `scripts/seed-test.mjs`, `scripts/purge-test-data.mjs` | Seed dan pembersih data uji (`npm run db:seed`, `db:purge-test`) |
| `scripts/check-project.mjs` | Pemeriksaan kondisi project (`npm run db:check`) |

**Catatan dari pelaksanaan:**
- Host database langsung (`db.<ref>.supabase.co`) hanya IPv6 dan tidak terjangkau dari jaringan pengembang. Migrasi memakai **Supavisor session pooler** `aws-1-ap-southeast-1.pooler.supabase.com:5432` (variabel `SUPABASE_POOLER_HOST`). Vercel Functions memakai API HTTPS, jadi tidak terpengaruh.
- Docker Desktop tidak berjalan, sehingga migrasi tidak diuji di database lokal lebih dulu (aturan 10.1 no. 4). Diterima karena project masih kosong. Untuk migrasi berikutnya, jalankan Docker dan uji dengan `supabase start` sebelum `npm run db:push`.
- Pembersih data uji ditulis sebagai skrip Node (`purge-test-data.mjs`), bukan SQL, karena berkas Storage dan user Auth harus dihapus lewat API.

**Belum dikerjakan (pindah ke fase berikutnya):**
- Akun admin Anda belum dibuat di project (3.7). Diperlukan di Fase 2.
- Google OAuth belum diaktifkan. Diperlukan di Fase 2.
### Fase 1: Siswa daftar, login, dan data tersimpan

**Tujuan:** siswa bisa mendaftar, login dari perangkat mana pun, dan jawabannya tersimpan.

Tugas:
- [ ] Vercel Functions di folder `api/`: `auth/register`, `auth/login`, `auth/change-pin` (bagian 3.3).
- [ ] Hash PIN: `scrypt(HMAC-SHA256(PEPPER, school_id:nis:pin), salt)`; aturan PIN (tolak PIN mudah); normalisasi NIS dan nama kelompok.
- [ ] Login NIS + PIN dengan pencarian kandidat lintas sekolah, batas 5 kandidat, penanganan bentrok (minta Kode Sekolah), pesan galat seragam, hash palsu untuk akun tak ada.
- [ ] Kunci akun 5 kali salah / 15 menit, pencatatan `auth_events`.
- [ ] CAPTCHA Turnstile (kunci uji di preview) dan batas laju per IP.
- [ ] Penerbitan sesi sesuai D8 (atau Opsi C bila Fase 0 menyimpulkan demikian).
- [ ] `vercel.json`: kecualikan `/api/*` dari rewrite ke `index.html`; atur environment variable (`PEPPER`, `service_role`, kunci CAPTCHA) hanya di Vercel.
- [ ] Frontend: `src/lib/supabase.ts`, `authApi.ts`, `sync.ts`; layar daftar/login di rute `/` (mode lokal tetap ada); layar ganti PIN (`must_change_pin`).
- [ ] Sinkron `student_state` dengan debounce 1,5 detik, antrean dan backoff saat gagal jaringan.
- [ ] Aturan gabung 6.1: cap `ownerId`, `dirty` dan `lastServerUpdatedAt`, `backup_before_merge` 7 hari, buang data lokal saat logout.
- [ ] Indikator sinkron di `AppShell` ("Tersinkron" / "Belum tersinkron").
- [ ] Sekolah dan kelas uji dibuat lewat seed (guru belum ada di fase ini).

**Kriteria selesai:**
- Siswa mendaftar dengan kode kelas seed, login di dua perangkat, dan jawabannya sama di keduanya.
- Akun terkunci setelah 5 kali PIN salah dan terbuka sendiri setelah 15 menit.
- Dua siswa memakai komputer yang sama bergantian tanpa data tercampur.
- NIS yang sama di dua sekolah tidak saling mengganggu.
- Aplikasi tetap bisa dipakai saat server tidak tersedia, dan tersinkron setelah pulih.

**Risiko:** salah tangani kandidat lintas sekolah (peluang tebakan PIN), kebocoran PIN di log.

### Fase 2: Guru dan admin

**Tujuan:** guru terverifikasi lewat kode dari admin dan dapat memulihkan akun siswa.

Tugas:
- [ ] Routing berbasis path `/`, `/guru`, `/admin`; bundel guru/admin dimuat terpisah (lazy-load); `storageKey` Supabase terpisah per area (3.8).
- [ ] Login admin (email + password, CAPTCHA, batas laju); admin produksi dibuat manual (3.7).
- [ ] Panel admin minimal (7.1): terbitkan kode aktivasi (sekolah ada/baru, email opsional, masa berlaku 3-90 hari default 14, `max_uses` default 30), lihat status dan daftar penebus, tandai guru baru, cabut dan perpanjang kode, nonaktifkan guru, kelola/gabung sekolah, ganti Kode Sekolah.
- [ ] Endpoint `admin/*` dan `teacher/activate` dengan semua pemeriksaan 3.5 (hash, kedaluwarsa, dicabut, `max_uses`, email terikat, satu guru satu sekolah, batas percobaan salah).
- [ ] Layar `/guru`: login Google, layar tebus kode, buat kelas dan kode kelas, ganti kode kelas.
- [ ] Aksi guru: buka kunci, reset PIN (PIN sementara tampil sekali), pindahkan siswa, nonaktifkan/hapus pendaftar, koreksi NIS (otomatis reset PIN).
- [ ] Semua endpoint staf memverifikasi token dan peran di server; semua tindakan tercatat di `auth_events`.
- [ ] Antarmuka guru sederhana: satu layar, tombol besar, teks jelas.

**Kriteria selesai:**
- Alur penuh berjalan: admin menerbitkan kode, guru login Google dan menebus, guru membuat kelas, siswa mendaftar dengan kode kelas itu, siswa terkunci, guru membukanya dan mereset PIN.
- Akun Google tanpa kode tidak melihat data apa pun.
- Guru sekolah lain tidak bisa membuka kunci siswa.
- Guru yang membuka `/admin` ditolak server (403).
- Kode kedaluwarsa, dicabut, atau melebihi `max_uses` ditolak.

**Risiko:** kode aktivasi bocor (D23), salah RLS pada peran guru.

### Fase 3: Data kelompok dan kolaborasi

**Tujuan:** Screen 9-16 menjadi kerja bersama anggota kelompok.

Tugas:
- [ ] Screen 9-16 membaca/menulis `group_state` lewat `patch_group_state`; klien membandingkan `data_meta` dan mengirim hanya kunci yang menang (6.1).
- [ ] `group_roles` untuk peran kelompok (Screen 9).
- [ ] `ideas` dan `idea_votes` untuk papan ide (Screen 11); satu siswa satu vote per ide.
- [ ] `test_trials` untuk tabel uji (Screen 14), urutan dengan `sort_order`.
- [ ] Realtime untuk `ideas`, `idea_votes`, `group_state`, dengan fallback polling 10 detik bila koneksi penuh.
- [ ] Penanganan konflik: salinan versi yang kalah disimpan 7 hari.

**Kriteria selesai:**
- Dua siswa di satu kelompok melihat ide dan data uji satu sama lain hampir langsung.
- Edit bersamaan di kolom berbeda tidak saling menimpa.
- Siswa di kelompok lain tidak bisa membaca atau menulis data kelompok ini.

**Risiko:** batas koneksi Realtime di Free, bentrok edit pada kolom yang sama (diterima: terakhir menang).

### Fase 4: Foto dan sketsa ke Storage

**Tujuan:** tidak ada lagi base64 di state; kuota terjaga.

Tugas:
- [ ] Kompresi di browser (sisi maks. 1280 px, kualitas sekitar 0,8, target 300 KB atau kurang).
- [ ] Unggah ke bucket `emodul-uploads` dengan path `{school_id}/{class_id}/{group_id}/{kind}-{uuid}.jpg`; simpan di `files`; tampilkan lewat signed URL berumur pendek.
- [ ] Screen 12 (sketsa kanvas dan foto desain) dan Screen 13 (foto proses, foto prototipe) memakai Storage; `lab_report` di Screen 9.
- [ ] Hapus `*DataUrl` dan `*PhotoUrl` base64 dari state yang disinkron.
- [ ] Migrasi data lama: base64 di localStorage dikonversi dan diunggah saat login pertama (dengan konfirmasi), lalu dibuang.
- [ ] Ekspor LKPD/portofolio tetap menampilkan gambar (mengambil dari signed URL).

**Kriteria selesai:**
- Foto tersimpan di Storage dan tampil di perangkat lain.
- Ukuran `student_state` / `group_state` tetap di bawah beberapa puluh KB.
- Berkas lebih dari 2 MB atau jenis tidak diizinkan ditolak.
- Anggota kelompok lain tidak bisa mengakses foto kelompok ini.

**Risiko:** kuota Storage 1 GB; unggah gagal di jaringan sekolah yang lambat (butuh antrean ulang).

### Fase 5: Dashboard guru lengkap

**Tujuan:** guru memantau satu kelas dari satu layar.

Tugas:
- [ ] View SQL `v_class_progress` dan `v_group_summary` dengan `security_invoker = on`.
- [ ] Daftar siswa: nama, NIS, kelompok, `completion_percent`, layar terakhir, terakhir login, status kunci.
- [ ] Ringkasan kelompok: jumlah ide per anggota (indikator minimal 2 ide), jumlah baris uji, status desain, ada atau tidaknya foto.
- [ ] Melihat jawaban siswa dan kelompok (hipotesis, jawaban simulasi, refleksi, data uji).
- [ ] Ekspor CSV (progres dan jawaban).
- [ ] Kartu login siswa yang bisa dicetak (Kode Sekolah, kode kelas, petunjuk singkat).
- [ ] Peringatan lonjakan pendaftaran (lebih dari 30 pendaftaran baru per jam pada satu kelas).

**Kriteria selesai:**
- Guru melihat progres seluruh kelas dan mengunduh rekap CSV.
- Guru hanya melihat data sekolahnya sendiri.
- Peringatan lonjakan muncul pada uji pendaftaran massal.

**Risiko:** kueri lambat bila data besar (pantau dan tambah indeks).

### Fase 6: Operasional dan siap dipakai

**Tujuan:** layanan tetap hidup, bisa dipulihkan, dan terdokumentasi.

Tugas:
- [ ] Vercel Cron harian `GET /api/ping` (dilindungi `CRON_SECRET`) yang memanggil RPC `ping()`.
- [ ] Cron mingguan `/api/maintenance`: hapus `auth_events` lebih dari 90 hari.
- [ ] Backup terjadwal: `pg_dump` mingguan (kemungkinan lewat GitHub Actions karena durasi), disimpan di tempat aman; tombol ekspor CSV untuk guru sudah dari Fase 5.
- [ ] Cek ulang batas Hobby dan status "Cron Jobs/Schedules" Vercel; bila deploy menolak, pindah ke GitHub Actions.
- [ ] Runbook: rotasi atau kehilangan `PEPPER`, restore dari backup, langkah saat project di-pause, menambah admin, mencabut guru, menghapus data siswa/sekolah (UU PDP).
- [ ] Uji akhir: beban kecil (puluhan siswa serentak), uji RLS ulang, tinjauan keamanan (tidak ada kunci di repo, log tanpa PIN).
- [ ] Pantau beberapa minggu bahwa project tidak pernah ter-pause.

**Kriteria selesai:**
- Project tetap aktif beberapa minggu tanpa trafik pengguna.
- Backup berhasil di-restore sekali pada project uji.
- Runbook dicoba minimal satu skenario (rotasi `PEPPER`).

**Risiko:** kebijakan pause Supabase atau batas cron Vercel berubah.

### 10.1 Migrasi dan lingkungan (D24)

Satu project Supabase `emodul` (ref `ivcewywkqvpdmvhqzzcb`, Singapore) melayani pengembangan dan production pada tahap pilot. Ini menyederhanakan setup dan menghemat jatah 2 project Free, dengan aturan berikut agar aman.

**Aturan selama satu project**
1. **Data uji terpisah.** Semua data uji berada di sekolah `is_test = true`. Dashboard admin menampilkan sekolah uji dengan label jelas dan tidak mencampurnya ke rekap nyata. Dibersihkan dengan `npm run db:purge-test`.
2. **Tidak ada admin dummy** (3.7). Pengujian peran guru memakai akun Google Anda sendiri.
3. **Preview Vercel menyentuh database yang sama.** Di preview, CAPTCHA memakai kunci uji Turnstile (selalu lolos), dan pengujian hanya dengan data sekolah uji. `PEPPER` sama dengan production (hash PIN harus cocok), jadi preview diperlakukan seperti production dalam hal rahasia.
4. **Migrasi aditif.** Tambah tabel/kolom, hindari menghapus atau mengubah tipe kolom. Sebelum migrasi yang destruktif, buat backup manual (`pg_dump`). Setiap migrasi diuji dulu pada salinan lokal (`supabase start`, database lokal dari CLI) sebelum `db push`.
5. **Pengujian lokal memakai database lokal.** Supabase CLI menjalankan Postgres lokal untuk uji RLS dan migrasi, tanpa menyentuh project cloud. Uji sesi D8 yang butuh Auth nyata dilakukan di project `emodul` dengan akun uji.
6. **Seed hanya data uji** (sekolah `is_test`), tidak ada kredensial staf.

**Kapan wajib dipisah menjadi `emodul-prod`**
- Sebelum siswa sungguhan mulai mendaftar.
- Atau saat ada migrasi besar yang tidak bisa dibuat aditif.

Cara memisah (murah karena skema ada di file migrasi): buat `emodul-prod` (Singapore, auto-grant mati, auto-RLS dicentang), jalankan semua migrasi, buat admin manual, isi environment variable Production di Vercel dengan URL, kunci, `PEPPER`, dan kunci CAPTCHA baru, lalu arahkan Preview/lokal ke `emodul` yang kini menjadi dev. Hapus data uji dari `emodul` bila perlu. Karena `PEPPER` production baru berbeda, tidak ada akun siswa nyata yang perlu dimigrasi bila pemisahan dilakukan **sebelum** pendaftaran dibuka.

**Rahasia**
- `service_role`, `PEPPER`, `CRON_SECRET`, dan kunci CAPTCHA hanya di environment variable Vercel dan `.env` lokal yang masuk `.gitignore`. Jangan pernah di repo.
- Password database hanya di password manager (dipakai CLI untuk `link` dan `db push`).

---
## 11. Pertanyaan terbuka

Tidak ada. Keputusan terakhir yang menutup daftar ini:

- **Ikatan email pada kode aktivasi (D22): opsional.** Bila admin mengisi email Google guru, kode hanya sah untuk email itu. Bila dikosongkan, siapa pun yang memegang kode dapat menjadi guru sampai kode kedaluwarsa, dicabut, atau mencapai `max_uses` (D23). Mitigasi: batas pemakaian, daftar penebus di panel admin, penandaan guru baru, dan peringatan di panel bila email kosong dengan masa berlaku lebih dari 7 hari.
- Undangan hanya oleh admin (D20), masa berlaku diatur admin (D20), tanpa MFA (D21).
Catatan dari keputusan sebelumnya:

- **Pengarsipan (D13):** belum dikerjakan. Data kelas lama menumpuk, tetapi pada skala Free (bagian 9) ini tidak masalah untuk satu-dua tahun. Dibahas lagi saat mendekati 70% kapasitas database atau saat tahun ajaran berganti.
- **Tanpa batas siswa (D14):** satu kode kelas yang bocor bisa dipakai banyak orang untuk mendaftar. Mitigasi: CAPTCHA, batas laju per IP, guru melihat dan menghapus pendaftar, dan mengganti kode kelas (D15). Dashboard guru memberi peringatan bila ada lebih dari 30 pendaftaran baru dalam satu jam pada satu kelas.
- **Kode kelas (D15):** ruang kodenya sekitar 32^6 (sekitar 1 miliar) ditambah batas percobaan per IP. Kode yang diganti membuat kode lama langsung tidak berlaku, siswa yang sudah terdaftar tidak terpengaruh.
- **Domain Vercel (D16):** CAPTCHA Turnstile didaftarkan dengan hostname produksi (`<nama-project>.vercel.app`). URL preview Vercel memakai subdomain berbeda tiap deploy, jadi di preview CAPTCHA memakai kunci uji Turnstile (selalu lolos) dan **tidak boleh** dipakai dengan data produksi. Menambah domain sendiri nanti hanya mendaftarkan hostname baru di Turnstile, Supabase Auth Site URL, dan daftar redirect.

---
## 12. Risiko ringkas

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Project di-pause | Data tak bisa disimpan sementara | Cron harian + local-first + antrean |
| Tanpa backup | Kehilangan data | Backup terjadwal + ekspor CSV |
| Foto base64 membengkak | Quota habis | Storage + kompresi |
| Tebak PIN (1 juta kemungkinan) | Akses akun siswa lain | Kunci 5x/15 menit, CAPTCHA, batas laju IP, pesan galat seragam, pepper di server |
| Kebocoran database | PIN dapat ditebak offline | `PEPPER` di luar database |
| Kehilangan/bocor `PEPPER` | Semua PIN harus direset | Runbook rotasi, penyimpanan aman di Vercel |
| Daftar mandiri tanpa verifikasi NIS | Pemalsuan/pendahuluan NIS orang lain | Satu NIS satu akun, kode kelas wajib, guru dapat menghapus/mereset |
| Perilaku `generateLink`+`verifyOtp` berubah | Login rusak | Uji di Fase 0, cadangan Opsi C |
| Komputer lab dipakai bergantian, data lokal siswa lain tergabung | Jawaban tertukar/bocor | Cap `ownerId` pada data lokal, buang data lokal saat logout (6.1) |
| Satu project untuk dev dan production (D24): percobaan atau migrasi merusak data nyata | Kehilangan atau kebocoran data siswa | Data uji di sekolah `is_test` + skrip pembersih, migrasi aditif dan diuji di database lokal, backup sebelum migrasi destruktif, tanpa admin dummy, wajib dipisah sebelum siswa sungguhan memakai (10.1) |
| Salah konfigurasi RLS atau rahasia PIN terbaca | Data siswa bocor | `npm run test:rls` (61 uji per peran) dijalankan ulang setiap migrasi, rahasia PIN di `student_secrets` tanpa grant klien (D25), `service_role` tidak pernah di klien |
| Kode kelas bocor lalu banyak pendaftar palsu (tanpa batas siswa) | Kelas dipenuhi akun tidak sah | CAPTCHA, batas laju IP, peringatan lonjakan pendaftaran, ganti kode kelas, guru menghapus akun |
| Orang luar (termasuk siswa) mengaku sebagai guru | Melihat data semua siswa, mereset PIN | Tidak ada pendaftaran guru terbuka; aktif hanya dengan kode dari admin (kedaluwarsa, `max_uses`, opsional terikat email); RLS menolak akun tanpa profil aktif (D18) |
| Kode aktivasi guru bocor atau diteruskan (kode dapat dipakai berkali-kali, D23) | Siapa pun yang memegang kode dapat menjadi guru di sekolah itu sampai kode kedaluwarsa, dicabut, atau habis `max_uses`. Guru palsu dapat membaca data siswa sekolah itu dan mereset PIN. | `max_uses` default 30, kedaluwarsa, ikat email bila memungkinkan, daftar penebus di panel admin dan penandaan guru baru, admin dapat mencabut kode dan menonaktifkan guru. Sebarkan kode hanya lewat kanal privat (bukan grup besar atau papan pengumuman). Risiko dibuat lebih besar bila masa berlaku panjang dan email kosong. |
| NIS sama di banyak sekolah | Satu tebakan PIN menguji banyak akun; beban hash | Maks. 5 kandidat tanpa kode sekolah, kunci per akun, CAPTCHA, batas laju IP; kasus bentrok minta Kode Sekolah |
| Akun admin tanpa MFA diretas (password bocor atau ditebak) | Akses penuh ke semua sekolah | Password panjang acak dari password manager, CAPTCHA + batas laju di `/admin`, `auth_events` mencatat tindakan admin; aktifkan MFA bila skala atau risiko naik (D21) |
| Guru membuka `/admin` atau memanggil API admin | Eskalasi hak akses | Peran diperiksa di server dan RLS pada setiap permintaan, bukan oleh rute |
| Sesi guru dan siswa saling menimpa di browser yang sama | Guru ter-logout, data tercampur | `storageKey` Supabase terpisah per area (3.8) |
| Siswa tidak tahu Kode Sekolah saat terjadi bentrok NIS | Tidak bisa login di perangkat baru | Hanya diminta saat bentrok; kartu login cetak dari dashboard guru; guru memberi tahu kode |
| Sekolah ganda | Data tersebar | Hanya admin membuat sekolah, NPSN unik, admin dapat menggabung |
| Batas Realtime | Papan ide tidak langsung | Fallback polling |
