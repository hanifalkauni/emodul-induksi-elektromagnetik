// Endpoint admin (spec 3.5, 7.1): kode aktivasi guru, guru, dan sekolah.

import { HttpError, json, readJson, str } from './http.js';
import { admin } from './supabase.js';
import { genCode, inviteHash, formatInviteCode } from './pin.js';
import { logEvent } from './guards.js';
import { requireAdmin, isUuid } from './staff.js';

const ALLOWED_DAYS = [3, 7, 14, 30, 60, 90]; // D20
const DEFAULT_DAYS = 14;
const DEFAULT_MAX_USES = 30; // D23
const BAN_FOREVER = '876000h';

function cleanText(raw, max) {
  return str(raw, max * 2).replace(/\s+/g, ' ').trim().slice(0, max);
}

function parseNpsn(raw) {
  const v = String(raw ?? '').replace(/\s+/g, '');
  if (!v) return null;
  if (!/^[0-9]{8}$/.test(v)) throw new HttpError(400, 'invalid_npsn', 'NPSN harus 8 angka.');
  return v;
}

function parseEmail(raw) {
  const v = String(raw ?? '').trim().toLowerCase();
  if (!v) return null;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || v.length > 200) throw new HttpError(400, 'invalid_email', 'Format email tidak valid.');
  return v;
}

function parseMaxUses(raw) {
  if (raw === null || raw === 'unlimited') return null;
  if (raw === undefined || raw === '') return DEFAULT_MAX_USES;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 1000) throw new HttpError(400, 'invalid_max_uses', 'Batas pemakaian 1–1000, atau tanpa batas.');
  return n;
}

function parseDays(raw) {
  const n = raw === undefined ? DEFAULT_DAYS : Number(raw);
  if (!ALLOWED_DAYS.includes(n)) throw new HttpError(400, 'invalid_days', `Masa berlaku harus salah satu dari ${ALLOWED_DAYS.join(', ')} hari.`);
  return n;
}

// ---------------------------------------------------------------------------
// Kode aktivasi guru
// ---------------------------------------------------------------------------
async function listInvites(request) {
  await requireAdmin(request);
  const db = admin();
  const { data, error } = await db
    .from('teacher_invites')
    .select('id, school_id, new_school_name, new_school_city, new_school_npsn, bound_email, expires_at, max_uses, use_count, revoked, created_at, schools(name, school_code), teacher_invite_redemptions(email, redeemed_at, user_id)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  const now = Date.now();
  return json(200, {
    invites: data.map((i) => ({
      id: i.id,
      schoolId: i.school_id,
      schoolName: i.schools?.name ?? i.new_school_name,
      schoolCode: i.schools?.school_code ?? null,
      newSchool: !i.school_id,
      boundEmail: i.bound_email,
      expiresAt: i.expires_at,
      maxUses: i.max_uses,
      useCount: i.use_count,
      revoked: i.revoked,
      createdAt: i.created_at,
      state: i.revoked ? 'revoked' : new Date(i.expires_at).getTime() < now ? 'expired'
        : i.max_uses !== null && i.use_count >= i.max_uses ? 'exhausted' : 'active',
      redemptions: (i.teacher_invite_redemptions ?? [])
        .sort((a, b) => b.redeemed_at.localeCompare(a.redeemed_at))
        .map((r) => ({ email: r.email, redeemedAt: r.redeemed_at, userId: r.user_id })),
    })),
  });
}

async function createInvite(request) {
  const staff = await requireAdmin(request);
  const body = await readJson(request);
  const db = admin();

  const row = {
    bound_email: parseEmail(body.boundEmail),
    max_uses: parseMaxUses(body.maxUses),
    expires_at: new Date(Date.now() + parseDays(body.days) * 86_400_000).toISOString(),
    created_by: staff.user.id,
  };

  if (body.schoolId) {
    if (!isUuid(body.schoolId)) throw new HttpError(400, 'invalid_school', 'Sekolah tidak valid.');
    const { data: school } = await db.from('schools').select('id, status').eq('id', body.schoolId).maybeSingle();
    if (!school || school.status !== 'active') throw new HttpError(404, 'school_not_found', 'Sekolah tidak ditemukan.');
    row.school_id = school.id;
  } else {
    const name = cleanText(body.newSchool?.name, 120);
    if (name.length < 3) throw new HttpError(400, 'invalid_school_name', 'Isi nama sekolah (minimal 3 huruf), atau pilih sekolah yang sudah ada.');
    const npsn = parseNpsn(body.newSchool?.npsn);
    if (npsn) {
      const { data: dup } = await db.from('schools').select('id, name').eq('npsn', npsn).maybeSingle();
      if (dup) throw new HttpError(409, 'npsn_exists', `NPSN ini sudah terdaftar untuk ${dup.name}. Pilih sekolah tersebut.`);
    }
    row.new_school_name = name;
    row.new_school_city = cleanText(body.newSchool?.city, 80) || null;
    row.new_school_npsn = npsn;
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = genCode(10);
    const { data, error } = await db.from('teacher_invites').insert({ ...row, code_hash: inviteHash(code) }).select('id').single();
    if (!error) {
      await logEvent({ school_id: row.school_id ?? null, actor_id: staff.user.id, event: 'invite_create',
        detail: { invite_id: data.id, new_school: !row.school_id, bound: Boolean(row.bound_email), max_uses: row.max_uses } });
      // Kode hanya dikembalikan sekali; database menyimpan hash-nya saja
      return json(201, { id: data.id, code: formatInviteCode(code), expiresAt: row.expires_at, maxUses: row.max_uses });
    }
    if (error.code !== '23505') throw error;
  }
  throw new HttpError(503, 'code_generation_failed', 'Gagal membuat kode. Coba lagi.');
}

async function loadInvite(id) {
  if (!isUuid(id)) throw new HttpError(400, 'invalid_invite', 'Kode tidak valid.');
  const { data } = await admin().from('teacher_invites').select('id, school_id, expires_at').eq('id', id).maybeSingle();
  if (!data) throw new HttpError(404, 'not_found', 'Kode tidak ditemukan.');
  return data;
}

async function revokeInvite(request) {
  const staff = await requireAdmin(request);
  const body = await readJson(request);
  const inv = await loadInvite(body.inviteId);
  const { error } = await admin().from('teacher_invites').update({ revoked: true }).eq('id', inv.id);
  if (error) throw error;
  await logEvent({ school_id: inv.school_id, actor_id: staff.user.id, event: 'invite_revoke', detail: { invite_id: inv.id } });
  return json(200, { ok: true });
}

async function extendInvite(request) {
  const staff = await requireAdmin(request);
  const body = await readJson(request);
  const inv = await loadInvite(body.inviteId);
  const days = parseDays(body.days);
  const base = Math.max(Date.now(), new Date(inv.expires_at).getTime());
  const expiresAt = new Date(base + days * 86_400_000).toISOString();
  const { error } = await admin().from('teacher_invites').update({ expires_at: expiresAt, revoked: false }).eq('id', inv.id);
  if (error) throw error;
  await logEvent({ school_id: inv.school_id, actor_id: staff.user.id, event: 'invite_extend', detail: { invite_id: inv.id, days } });
  return json(200, { expiresAt });
}

// ---------------------------------------------------------------------------
// Guru
// ---------------------------------------------------------------------------
async function listTeachers(request) {
  await requireAdmin(request);
  const { data, error } = await admin()
    .from('profiles')
    .select('user_id, email, display_name, status, school_id, created_at, schools(name)')
    .eq('role', 'teacher')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  const dayAgo = Date.now() - 86_400_000 * 3;
  return json(200, {
    teachers: data.map((t) => ({
      userId: t.user_id, email: t.email, displayName: t.display_name, status: t.status,
      schoolId: t.school_id, schoolName: t.schools?.name ?? '', createdAt: t.created_at,
      isNew: new Date(t.created_at).getTime() > dayAgo,
    })),
  });
}

async function setTeacherStatus(request) {
  const staff = await requireAdmin(request);
  const body = await readJson(request);
  if (!isUuid(body.userId)) throw new HttpError(400, 'invalid_user', 'Guru tidak valid.');
  const status = body.status === 'disabled' ? 'disabled' : body.status === 'active' ? 'active' : null;
  if (!status) throw new HttpError(400, 'invalid_status', 'Status harus active atau disabled.');
  const db = admin();
  const { data: prof } = await db.from('profiles').select('user_id, role, school_id').eq('user_id', body.userId).maybeSingle();
  if (!prof || prof.role !== 'teacher') throw new HttpError(404, 'not_found', 'Guru tidak ditemukan.');
  const { error } = await db.from('profiles').update({ status }).eq('user_id', prof.user_id);
  if (error) throw error;
  const { error: banErr } = await db.auth.admin.updateUserById(prof.user_id, { ban_duration: status === 'disabled' ? BAN_FOREVER : 'none' });
  if (banErr) console.error('ban guru gagal:', banErr.message);
  await logEvent({ school_id: prof.school_id, actor_id: staff.user.id, event: status === 'disabled' ? 'teacher_disable' : 'teacher_enable',
    detail: { teacher_id: prof.user_id } });
  return json(200, { ok: true, status });
}

// ---------------------------------------------------------------------------
// Sekolah
// ---------------------------------------------------------------------------
async function listSchools(request) {
  await requireAdmin(request);
  const { data, error } = await admin()
    .from('schools')
    .select('id, name, school_code, npsn, city, is_test, status, created_at')
    .eq('status', 'active')
    .order('name')
    .limit(1000);
  if (error) throw error;
  return json(200, { schools: data });
}

/** Buat (tanpa id) atau ubah (dengan id) sekolah. */
async function saveSchool(request) {
  const staff = await requireAdmin(request);
  const body = await readJson(request);
  const name = cleanText(body.name, 120);
  if (name.length < 3) throw new HttpError(400, 'invalid_school_name', 'Nama sekolah minimal 3 huruf.');
  const row = { name, city: cleanText(body.city, 80) || null, npsn: parseNpsn(body.npsn) };
  const db = admin();
  let result;
  if (body.id) {
    if (!isUuid(body.id)) throw new HttpError(400, 'invalid_school', 'Sekolah tidak valid.');
    result = await db.from('schools').update(row).eq('id', body.id).select('id').maybeSingle();
    if (!result.error && !result.data) throw new HttpError(404, 'not_found', 'Sekolah tidak ditemukan.');
  } else {
    result = await db.from('schools').insert({ ...row, created_by: staff.user.id }).select('id').single();
  }
  if (result.error) {
    if (result.error.code === '23505') throw new HttpError(409, 'npsn_exists', 'NPSN ini sudah dipakai sekolah lain.');
    throw result.error;
  }
  await logEvent({ school_id: result.data.id, actor_id: staff.user.id, event: body.id ? 'school_update' : 'school_create' });
  return json(body.id ? 200 : 201, { id: result.data.id });
}

async function rotateSchoolCode(request) {
  const staff = await requireAdmin(request);
  const body = await readJson(request);
  if (!isUuid(body.schoolId)) throw new HttpError(400, 'invalid_school', 'Sekolah tidak valid.');
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = genCode(6);
    const { data, error } = await admin().from('schools').update({ school_code: code }).eq('id', body.schoolId).select('id').maybeSingle();
    if (!error) {
      if (!data) throw new HttpError(404, 'not_found', 'Sekolah tidak ditemukan.');
      await logEvent({ school_id: body.schoolId, actor_id: staff.user.id, event: 'school_code_rotate' });
      return json(200, { schoolCode: code });
    }
    if (error.code !== '23505') throw error;
  }
  throw new HttpError(503, 'code_generation_failed', 'Gagal membuat kode baru. Coba lagi.');
}

export const adminRoutes = {
  'admin/invites': { GET: listInvites, POST: createInvite },
  'admin/invites/revoke': { POST: revokeInvite },
  'admin/invites/extend': { POST: extendInvite },
  'admin/teachers': { GET: listTeachers },
  'admin/teachers/set-status': { POST: setTeacherStatus },
  'admin/schools': { GET: listSchools, POST: saveSchool },
  'admin/schools/rotate-code': { POST: rotateSchoolCode },
};
