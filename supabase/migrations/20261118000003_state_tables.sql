-- 0003: tabel data e-modul (individu + kelompok)
-- Batas ukuran jsonb dipasang agar satu akun tidak bisa menghabiskan kuota 500 MB (Free plan).

create table public.student_state (
  student_id           uuid primary key references public.students (id) on delete cascade,
  current_screen       int not null default 1 check (current_screen between 1 and 17),
  visited_screens      int[] not null default '{}'
                         check (visited_screens <@ array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17]),
  completion_percent   int not null default 0 check (completion_percent between 0 and 100),
  data                 jsonb not null default '{}'::jsonb
                         check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 262144),
  updated_at           timestamptz not null default now()
);

create table public.group_state (
  group_id    uuid primary key references public.groups (id) on delete cascade,
  data        jsonb not null default '{}'::jsonb
                check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 262144),
  -- kunci -> waktu ubah (server) untuk penggabungan lokal vs server per kunci (spec 6.1)
  data_meta   jsonb not null default '{}'::jsonb
                check (jsonb_typeof(data_meta) = 'object' and pg_column_size(data_meta) <= 65536),
  updated_at  timestamptz not null default now()
);

create table public.group_roles (
  group_id          uuid not null references public.groups (id) on delete cascade,
  role              text not null check (role in ('Leader', 'Engineer', 'Data Analyst', 'Experimenter', 'Communicator')),
  member_name       text not null default '' check (char_length(member_name) <= 100),
  task_description  text not null default '' check (char_length(task_description) <= 300),
  member_id         uuid references public.students (id) on delete set null,
  updated_at        timestamptz not null default now(),
  primary key (group_id, role)
);

create table public.ideas (
  id               uuid primary key default gen_random_uuid(),
  group_id         uuid not null references public.groups (id) on delete cascade,
  author_id        uuid references public.students (id) on delete set null,
  author_name      text not null check (char_length(btrim(author_name)) between 1 and 100),
  title            text not null check (char_length(btrim(title)) between 1 and 120),
  drive_mechanism  text not null default 'Engkol Manual'
                     check (drive_mechanism in ('Engkol Manual', 'Kincir Angin', 'Kincir Air', 'Gravitasi / Beban', 'Lainnya')),
  description      text not null check (char_length(btrim(description)) between 1 and 1000),
  color            text not null default 'cyan' check (color in ('cyan', 'amber', 'emerald', 'indigo')),
  created_at       timestamptz not null default now()
);
create index ideas_group_idx on public.ideas (group_id, created_at);

create table public.idea_votes (
  idea_id     uuid not null references public.ideas (id) on delete cascade,
  voter_id    uuid not null references public.students (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (idea_id, voter_id)
);

create table public.test_trials (
  id                uuid primary key default gen_random_uuid(),
  group_id          uuid not null references public.groups (id) on delete cascade,
  sort_order        int not null default 0,
  trial_label       text not null default '' check (char_length(trial_label) <= 60),
  voltage           text not null default '' check (char_length(voltage) <= 30),
  turns             text not null default '' check (char_length(turns) <= 30),
  speed             text not null default 'Sedang' check (char_length(speed) <= 30),
  magnet_condition  text not null default '' check (char_length(magnet_condition) <= 100),
  led_lit           text not null default 'Tidak' check (led_lit in ('Ya', 'Tidak')),
  updated_at        timestamptz not null default now()
);
create index test_trials_group_idx on public.test_trials (group_id, sort_order);

create table public.files (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups (id) on delete cascade,
  kind          text not null check (kind in ('process_photo', 'prototype_photo', 'design_sketch', 'lab_report')),
  storage_path  text not null unique,
  file_name     text not null default '' check (char_length(file_name) <= 200),
  size_bytes    int not null default 0 check (size_bytes between 0 and 2097152),
  uploaded_by   uuid references public.students (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index files_group_idx on public.files (group_id);
