-- 0002: tabel inti (sekolah, staf, kelas, kelompok, siswa, audit, undangan guru)
-- Catatan desain: pin_hash/pin_salt/failed_attempts DIPISAH ke student_secrets (hanya service_role)
-- sehingga tabel `students` aman dibaca guru tanpa pengaturan hak per kolom.

create table public.schools (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(btrim(name)) between 3 and 120),
  school_code  text not null unique default private.gen_code(6),
  npsn         text unique check (npsn is null or npsn ~ '^[0-9]{8}$'),
  city         text check (city is null or char_length(city) <= 80),
  is_test      boolean not null default false,
  status       text not null default 'active' check (status in ('active', 'merged')),
  merged_into  uuid references public.schools (id),
  created_by   uuid,
  created_at   timestamptz not null default now()
);

create table public.profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  role         text not null check (role in ('teacher', 'admin')),
  status       text not null default 'active' check (status in ('active', 'disabled')),
  display_name text check (display_name is null or char_length(display_name) <= 100),
  email        text,
  school_id    uuid references public.schools (id) on delete restrict,
  created_at   timestamptz not null default now(),
  check (role = 'admin' or school_id is not null)
);
create index profiles_school_idx on public.profiles (school_id);

create table public.classes (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools (id) on delete cascade,
  teacher_id  uuid references public.profiles (user_id) on delete set null,
  name        text not null check (char_length(btrim(name)) between 1 and 80),
  join_code   text not null unique default private.gen_code(6),
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index classes_school_idx on public.classes (school_id);

create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references public.classes (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 60),
  -- kunci normalisasi: "Kelompok  3" dan "kelompok 3" dianggap sama
  name_key    text generated always as (lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))) stored,
  created_at  timestamptz not null default now(),
  unique (class_id, name_key)
);

create table public.students (
  id               uuid primary key references auth.users (id) on delete cascade,
  school_id        uuid not null references public.schools (id) on delete cascade,
  class_id         uuid references public.classes (id) on delete set null,
  group_id         uuid references public.groups (id) on delete set null,
  nis              text not null check (nis ~ '^[A-Z0-9]{4,20}$'),
  student_name     text not null check (char_length(btrim(student_name)) between 2 and 100),
  must_change_pin  boolean not null default false,
  locked_until     timestamptz,
  last_login_at    timestamptz,
  status           text not null default 'active' check (status in ('active', 'disabled')),
  created_at       timestamptz not null default now(),
  unique (school_id, nis)
);
create index students_nis_idx on public.students (nis);
create index students_class_idx on public.students (class_id);
create index students_group_idx on public.students (group_id);

-- Rahasia PIN: tidak ada grant ke anon/authenticated (hanya service_role).
create table public.student_secrets (
  student_id       uuid primary key references public.students (id) on delete cascade,
  pin_hash         text not null,
  pin_salt         text not null,
  failed_attempts  int not null default 0 check (failed_attempts >= 0),
  updated_at       timestamptz not null default now()
);

create table public.auth_events (
  id          bigint generated always as identity primary key,
  school_id   uuid references public.schools (id) on delete set null,
  student_id  uuid references public.students (id) on delete set null,
  nis         text,
  actor_id    uuid,
  ip_hash     text,
  event       text not null check (event in (
                'register', 'login_ok', 'login_fail', 'locked', 'unlock', 'reset_pin',
                'change_pin', 'disabled', 'move', 'teacher_activate', 'invite_create',
                'invite_revoke', 'teacher_disable', 'school_create', 'school_merge')),
  detail      jsonb,
  created_at  timestamptz not null default now()
);
create index auth_events_school_idx on public.auth_events (school_id, created_at desc);
create index auth_events_created_idx on public.auth_events (created_at);

-- Kode aktivasi guru (D18, D20, D22, D23). Hanya hash yang disimpan. Tidak ada grant ke klien.
create table public.teacher_invites (
  id                uuid primary key default gen_random_uuid(),
  code_hash         text not null unique,
  school_id         uuid references public.schools (id) on delete cascade,
  new_school_name   text check (new_school_name is null or char_length(btrim(new_school_name)) between 3 and 120),
  new_school_city   text,
  new_school_npsn   text check (new_school_npsn is null or new_school_npsn ~ '^[0-9]{8}$'),
  bound_email       text check (bound_email is null or bound_email = lower(bound_email)),
  created_by        uuid references public.profiles (user_id) on delete set null,
  expires_at        timestamptz not null,
  max_uses          int check (max_uses is null or max_uses >= 1),
  use_count         int not null default 0 check (use_count >= 0),
  revoked           boolean not null default false,
  created_at        timestamptz not null default now(),
  check (school_id is not null or new_school_name is not null)
);

create table public.teacher_invite_redemptions (
  id           uuid primary key default gen_random_uuid(),
  invite_id    uuid not null references public.teacher_invites (id) on delete cascade,
  user_id      uuid not null references public.profiles (user_id) on delete cascade,
  email        text,
  redeemed_at  timestamptz not null default now(),
  unique (invite_id, user_id)
);
