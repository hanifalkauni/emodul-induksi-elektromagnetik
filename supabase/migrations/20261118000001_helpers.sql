-- 0001: skema privat + fungsi pembantu umum
-- Fungsi bantu RLS ditaruh di schema `private` supaya TIDAK terekspos sebagai RPC lewat Data API
-- (hanya schema `public` yang diekspos).

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- Kode acak 32 simbol tanpa 0/O/1/I (D15). 256 % 32 = 0, jadi tidak ada bias modulo.
-- Memakai gen_random_uuid() (CSPRNG) sebagai sumber byte; maks. 16 karakter.
create or replace function private.gen_code(n int default 6)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  b bytea := uuid_send(gen_random_uuid());
  result text := '';
  i int;
begin
  if n < 1 or n > 16 then
    raise exception 'gen_code: n harus 1..16';
  end if;
  for i in 0 .. n - 1 loop
    result := result || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
  end loop;
  return result;
end;
$$;

-- Konversi aman text -> uuid (null bila tidak valid), dipakai policy Storage.
create or replace function private.try_uuid(p text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return p::uuid;
exception when others then
  return null;
end;
$$;

-- Trigger pembaruan updated_at
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

grant execute on function private.gen_code(int) to authenticated, service_role;
grant execute on function private.try_uuid(text) to authenticated, service_role;
