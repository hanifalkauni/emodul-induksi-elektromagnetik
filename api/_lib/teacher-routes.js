// Endpoint guru (spec 3.3, 3.5): status akun, aktivasi kode, dan tindakan pada siswa.
// Semua tindakan juga boleh dilakukan admin di sekolah mana pun.

import { HttpError, json, readJson, clientIp, str } from './http.js';
import { admin } from './supabase.js';
import { normalizeNis, isValidNis, hashPin, genTempPin, genCode, normalizeInviteCode, isValidInviteCode, inviteHash, hmacKey } from './pin.js';
import { rateLimit, logEvent } from './guards.js';
import { currentStaffUser, requireStaff, loadStudentForStaff, loadClassForStaff } from './staff.js';

const BAN_FOREVER = '876000h'; // ~100 tahun: memblokir refresh token akun yang dinonaktifkan

function cleanName(raw, max) {
  return str(raw, max * 2).replace(/\s+/g, ' ').trim().slice(0, max);
}

async function schoolInfo(schoolId) {
  if (!schoolId) return null;
  const { data } = await admin().from('schools').select('id, name, school_code, city, npsn, is_test').eq('id', schoolId).maybeSingle();
  return data ?? null;
}

// ---------------------------------------------------------------------------
// GET /api/teacher/me : status akun staf (dipakai layar /guru dan /admin)
// ---------------------------------------------------------------------------
async function me(request) {
  const { user, profile } = await currentStaffUser(request);
  const { data: student } = await admin().from('students').select('id').eq('id', user.id).maybeSingle();
  return json(200, {
    email: user.email ?? '',
    isStudent: Boolean(student),
    profile: profile
      ? { role: profile.role, status: profile.status, schoolId: profile.school_id, displayName: profile.display_name }
      : null,
    school: profile ? await schoolInfo(profile.school_id) : null,
  });
}

// ---------------------------------------------------------------------------
// POST /api/teacher/activate { code }
// ---------------------------------------------------------------------------
const REDEEM_ERRORS = {
  invite_not_found: [404, 'Kode aktivasi tidak ditemukan. Periksa lagi kode dari admin.'],
  invite_revoked: [410, 'Kode aktivasi ini sudah dicabut admin. Minta kode baru.'],
  invite_expired: [410, 'Kode aktivasi sudah kedaluwarsa. Minta kode baru ke admin.'],
  invite_exhausted: [410, 'Kode aktivasi sudah mencapai batas pemakaian. Minta kode baru ke admin.'],
  invite_email_mismatch: [403, 'Kode ini khusus untuk email Google lain. Masuk dengan akun Google yang didaftarkan admin.'],
  is_student: [403, 'Akun ini adalah akun siswa.'],
  is_admin: [409, 'Akun ini sudah admin. Buka halaman /admin.'],
  teacher_disabled: [403, 'Akun guru ini dinonaktifkan. Hubungi admin.'],
  other_school: [409, 'Akun ini sudah terdaftar sebagai guru di sekolah lain. Satu akun hanya untuk satu sekolah.'],
  npsn_exists: [409, 'Sekolah dengan NPSN ini sudah ada. Minta admin menerbitkan kode untuk sekolah tersebut.'],
  school_inactive: [410, 'Sekolah untuk kode ini sudah tidak aktif. Hubungi admin.'],
};

async function activate(request) {
  const ip = clientIp(request);
  const { user } = await currentStaffUser(request);
  const body = await readJson(request);
  await rateLimit('activate_user', user.id, 5, 3600);
  await rateLimit('activate_ip', ip, 10, 3600);

  const code = normalizeInviteCode(body.code);
  if (!isValidInviteCode(code)) throw new HttpError(400, 'invalid_code', 'Kode aktivasi berisi 10 huruf/angka, contoh ABCDE-23456.');

  const { data, error } = await admin().rpc('redeem_teacher_invite', {
    p_code_hash: inviteHash(code),
    p_user: user.id,
    p_email: user.email ?? '',
  });
  if (error) {
    const known = REDEEM_ERRORS[error.message];
    if (known) throw new HttpError(known[0], error.message, known[1]);
    throw error;
  }
  if (!data.already) {
    await logEvent({
      school_id: data.school_id, actor_id: user.id, event: 'teacher_activate', ip_hash: hmacKey(ip),
      detail: { email: user.email, created_school: data.created_school },
    });
  }
  return json(200, { schoolId: data.school_id, already: data.already, createdSchool: data.created_school, school: await schoolInfo(data.school_id) });
}

// ---------------------------------------------------------------------------
// Tindakan pada siswa
// ---------------------------------------------------------------------------
async function unlock(request) {
  const staff = await requireStaff(request);
  const body = await readJson(request);
  const s = await loadStudentForStaff(staff, body.studentId);
  const db = admin();
  const { error } = await db.from('students').update({ locked_until: null }).eq('id', s.id);
  if (error) throw error;
  await db.from('student_secrets').update({ failed_attempts: 0 }).eq('student_id', s.id);
  await logEvent({ school_id: s.school_id, student_id: s.id, nis: s.nis, actor_id: staff.user.id, event: 'unlock' });
  return json(200, { ok: true });
}

/** Ganti PIN dengan PIN sementara acak; siswa wajib membuat PIN baru saat masuk (must_change_pin). */
async function setTempPin(s, nis = s.nis) {
  const tempPin = genTempPin(nis);
  const hashed = await hashPin(s.school_id, nis, tempPin);
  const db = admin();
  const { error } = await db.from('student_secrets')
    .update({ ...hashed, failed_attempts: 0, updated_at: new Date().toISOString() }).eq('student_id', s.id);
  if (error) throw error;
  return tempPin;
}

async function resetPin(request) {
  const staff = await requireStaff(request);
  const body = await readJson(request);
  const s = await loadStudentForStaff(staff, body.studentId);
  const tempPin = await setTempPin(s);
  const { error } = await admin().from('students').update({ must_change_pin: true, locked_until: null }).eq('id', s.id);
  if (error) throw error;
  await logEvent({ school_id: s.school_id, student_id: s.id, nis: s.nis, actor_id: staff.user.id, event: 'reset_pin' });
  return json(200, { tempPin });
}

async function findOrCreateGroup(classId, rawName) {
  const name = cleanName(rawName, 60);
  if (!name) throw new HttpError(400, 'invalid_group', 'Isi nama kelompok tujuan.');
  const db = admin();
  const key = name.toLowerCase();
  const { data: found } = await db.from('groups').select('id, name').eq('class_id', classId).eq('name_key', key).maybeSingle();
  if (found) return found;
  const { data: created, error } = await db.from('groups').insert({ class_id: classId, name }).select('id, name').single();
  if (error?.code === '23505') {
    const { data } = await db.from('groups').select('id, name').eq('class_id', classId).eq('name_key', key).single();
    return data;
  }
  if (error) throw error;
  return created;
}

async function moveStudent(request) {
  const staff = await requireStaff(request);
  const body = await readJson(request);
  const s = await loadStudentForStaff(staff, body.studentId);
  const klass = await loadClassForStaff(staff, body.classId);
  if (klass.school_id !== s.school_id) throw new HttpError(400, 'other_school', 'Siswa hanya bisa dipindah ke kelas di sekolah yang sama.');
  if (klass.archived) throw new HttpError(400, 'class_archived', 'Kelas tujuan sudah diarsipkan.');
  const group = await findOrCreateGroup(klass.id, body.groupName);
  const { error } = await admin().from('students').update({ class_id: klass.id, group_id: group.id }).eq('id', s.id);
  if (error) throw error;
  await logEvent({
    school_id: s.school_id, student_id: s.id, nis: s.nis, actor_id: staff.user.id, event: 'move',
    detail: { from: { class_id: s.class_id, group_id: s.group_id }, to: { class_id: klass.id, group_id: group.id } },
  });
  return json(200, { classId: klass.id, groupId: group.id, groupName: group.name });
}

/** Ubah nama dan/atau NIS. NIS ikut di hash PIN, jadi koreksi NIS otomatis mereset PIN (spec 3.6). */
async function updateStudent(request) {
  const staff = await requireStaff(request);
  const body = await readJson(request);
  const s = await loadStudentForStaff(staff, body.studentId);
  const patch = {};
  if (body.name !== undefined) {
    const name = cleanName(body.name, 100);
    if (name.length < 2) throw new HttpError(400, 'invalid_name', 'Nama minimal 2 huruf.');
    patch.student_name = name;
  }
  let tempPin = null;
  if (body.nis !== undefined) {
    const nis = normalizeNis(body.nis);
    if (!isValidNis(nis)) throw new HttpError(400, 'invalid_nis', 'NIS harus 4–20 karakter huruf atau angka.');
    if (nis !== s.nis) {
      const { data: taken } = await admin().from('students').select('id').eq('school_id', s.school_id).eq('nis', nis).maybeSingle();
      if (taken) throw new HttpError(409, 'nis_taken', 'NIS ini sudah dipakai siswa lain di sekolah ini.');
      patch.nis = nis;
      tempPin = await setTempPin(s, nis);
      patch.must_change_pin = true;
      patch.locked_until = null;
    }
  }
  if (!Object.keys(patch).length) throw new HttpError(400, 'nothing_to_update', 'Tidak ada perubahan.');
  const { error } = await admin().from('students').update(patch).eq('id', s.id);
  if (error) {
    if (error.code === '23505') throw new HttpError(409, 'nis_taken', 'NIS ini sudah dipakai siswa lain di sekolah ini.');
    throw error;
  }
  await logEvent({
    school_id: s.school_id, student_id: s.id, nis: patch.nis ?? s.nis, actor_id: staff.user.id, event: 'student_update',
    detail: { nisChanged: Boolean(patch.nis), oldNis: patch.nis ? s.nis : undefined, nameChanged: Boolean(patch.student_name) },
  });
  return json(200, { ok: true, tempPin });
}

async function setStudentStatus(request) {
  const staff = await requireStaff(request);
  const body = await readJson(request);
  const s = await loadStudentForStaff(staff, body.studentId);
  const status = body.status === 'disabled' ? 'disabled' : body.status === 'active' ? 'active' : null;
  if (!status) throw new HttpError(400, 'invalid_status', 'Status harus active atau disabled.');
  const db = admin();
  const { error } = await db.from('students').update({ status }).eq('id', s.id);
  if (error) throw error;
  // Blokir refresh token akun nonaktif; sesi yang sedang berjalan habis paling lama 1 jam,
  // dan selama itu RLS sudah menolak penulisan (is_active_student).
  const { error: banErr } = await db.auth.admin.updateUserById(s.id, { ban_duration: status === 'disabled' ? BAN_FOREVER : 'none' });
  if (banErr) console.error('updateUserById ban gagal:', banErr.message);
  await logEvent({ school_id: s.school_id, student_id: s.id, nis: s.nis, actor_id: staff.user.id, event: status === 'disabled' ? 'disabled' : 'enabled' });
  return json(200, { ok: true, status });
}

/** Hapus akun siswa beserta datanya (pendaftar palsu, D14). Tidak bisa dibatalkan. */
async function deleteStudent(request) {
  const staff = await requireStaff(request);
  const body = await readJson(request);
  const s = await loadStudentForStaff(staff, body.studentId);
  if (body.confirmNis !== s.nis) throw new HttpError(400, 'confirm_required', 'Ketik NIS siswa untuk konfirmasi penghapusan.');
  await logEvent({ school_id: s.school_id, nis: s.nis, actor_id: staff.user.id, event: 'student_delete', detail: { name: s.student_name } });
  const { error } = await admin().auth.admin.deleteUser(s.id);
  if (error) throw error;
  return json(200, { ok: true });
}

async function rotateJoinCode(request) {
  const staff = await requireStaff(request);
  const body = await readJson(request);
  const klass = await loadClassForStaff(staff, body.classId);
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = genCode(6);
    const { error } = await admin().from('classes').update({ join_code: code }).eq('id', klass.id);
    if (!error) {
      await logEvent({ school_id: klass.school_id, actor_id: staff.user.id, event: 'join_code_rotate', detail: { class_id: klass.id } });
      return json(200, { joinCode: code });
    }
    if (error.code !== '23505') throw error;
  }
  throw new HttpError(503, 'code_generation_failed', 'Gagal membuat kode baru. Coba lagi.');
}

export const teacherRoutes = {
  'teacher/me': { GET: me },
  'teacher/activate': { POST: activate },
  'teacher/unlock': { POST: unlock },
  'teacher/reset-pin': { POST: resetPin },
  'teacher/move-student': { POST: moveStudent },
  'teacher/update-student': { POST: updateStudent },
  'teacher/set-student-status': { POST: setStudentStatus },
  'teacher/delete-student': { POST: deleteStudent },
  'teacher/rotate-join-code': { POST: rotateJoinCode },
};
