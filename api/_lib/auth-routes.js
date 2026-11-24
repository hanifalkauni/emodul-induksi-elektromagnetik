// Endpoint akun siswa (spec 3.2, 3.3, 3.6): daftar, masuk, ganti PIN.

import { HttpError, json, readJson, clientIp, bearerToken, str } from './http.js';
import { admin, syntheticStudentEmail, issueSession, userFromToken } from './supabase.js';
import { normalizeNis, isValidNis, normalizeCode, isValidCode, pinPolicyError, hashPin, verifyPin, dummyVerify, hmacKey } from './pin.js';
import { verifyCaptcha, rateLimit, logEvent } from './guards.js';

const MAX_CANDIDATES = 5; // spec 3.3 langkah 3
const GENERIC_LOGIN_ERROR = 'NIS atau PIN salah.';

function cleanName(raw, max) {
  return str(raw, max * 2).replace(/\s+/g, ' ').trim().slice(0, max);
}

async function studentPayload(studentId) {
  const db = admin();
  const { data: s, error } = await db
    .from('students')
    .select('id, nis, student_name, must_change_pin, school_id, class_id, group_id')
    .eq('id', studentId)
    .single();
  if (error) throw error;
  const [{ data: school }, { data: klass }, { data: group }] = await Promise.all([
    db.from('schools').select('name, school_code').eq('id', s.school_id).single(),
    s.class_id ? db.from('classes').select('name').eq('id', s.class_id).maybeSingle() : Promise.resolve({ data: null }),
    s.group_id ? db.from('groups').select('name').eq('id', s.group_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return {
    id: s.id,
    nis: s.nis,
    name: s.student_name,
    mustChangePin: s.must_change_pin,
    schoolName: school?.name ?? '',
    schoolCode: school?.school_code ?? '',
    className: klass?.name ?? '',
    groupName: group?.name ?? '',
  };
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
async function register(request) {
  const ip = clientIp(request);
  const body = await readJson(request);

  await rateLimit('register_ip', ip, 20, 3600);
  await verifyCaptcha(body.captchaToken, ip);

  const joinCode = normalizeCode(body.classCode);
  const nis = normalizeNis(body.nis);
  const name = cleanName(body.name, 100);
  const groupName = cleanName(body.groupName, 60);
  const pin = str(body.pin, 10);

  if (!isValidCode(joinCode)) throw new HttpError(400, 'invalid_class_code', 'Kode kelas harus 6 karakter (huruf dan angka).');
  if (!isValidNis(nis)) throw new HttpError(400, 'invalid_nis', 'NIS harus 4–20 karakter huruf atau angka.');
  if (name.length < 2) throw new HttpError(400, 'invalid_name', 'Isi nama lengkap (minimal 2 huruf).');
  if (groupName.length < 1) throw new HttpError(400, 'invalid_group', 'Isi nama kelompok.');
  if (str(body.pinConfirm, 10) !== pin) throw new HttpError(400, 'pin_mismatch', 'Konfirmasi PIN tidak sama.');
  const weak = pinPolicyError(pin, nis);
  if (weak) throw new HttpError(400, 'weak_pin', weak);

  await rateLimit('class_code_ip', ip, 30, 3600);

  const db = admin();
  const { data: klass, error: classErr } = await db
    .from('classes')
    .select('id, school_id, archived')
    .eq('join_code', joinCode)
    .maybeSingle();
  if (classErr) throw classErr;
  if (!klass || klass.archived) {
    throw new HttpError(404, 'class_not_found', 'Kode kelas tidak ditemukan. Periksa lagi kode dari guru.');
  }

  const { data: school, error: schoolErr } = await db
    .from('schools').select('id, status').eq('id', klass.school_id).single();
  if (schoolErr) throw schoolErr;
  if (school.status !== 'active') throw new HttpError(404, 'class_not_found', 'Kode kelas tidak ditemukan.');

  const { data: existing } = await db
    .from('students').select('id').eq('school_id', klass.school_id).eq('nis', nis).maybeSingle();
  if (existing) {
    throw new HttpError(409, 'nis_taken',
      'NIS ini sudah terdaftar di sekolah ini. Pilih "Masuk", atau minta guru mereset PIN bila lupa.');
  }

  // Cari kelompok (tanpa membedakan huruf besar/kecil) atau buat baru
  const key = groupName.toLowerCase();
  let { data: group } = await db
    .from('groups').select('id, name').eq('class_id', klass.id).eq('name_key', key).maybeSingle();
  if (!group) {
    const { data: created, error: gErr } = await db
      .from('groups').insert({ class_id: klass.id, name: groupName }).select('id, name').single();
    if (gErr && gErr.code === '23505') {
      ({ data: group } = await db.from('groups').select('id, name').eq('class_id', klass.id).eq('name_key', key).single());
    } else if (gErr) {
      throw gErr;
    } else {
      group = created;
    }
  }

  const email = syntheticStudentEmail();
  const { data: authUser, error: userErr } = await db.auth.admin.createUser({ email, email_confirm: true });
  if (userErr || !authUser?.user) {
    console.error('createUser gagal:', userErr?.message);
    throw new HttpError(503, 'register_failed', 'Pendaftaran gagal. Coba lagi sebentar lagi.');
  }
  const userId = authUser.user.id;

  try {
    const { error: sErr } = await db.from('students').insert({
      id: userId, school_id: klass.school_id, class_id: klass.id, group_id: group.id, nis, student_name: name,
    });
    if (sErr) {
      if (sErr.code === '23505') {
        throw new HttpError(409, 'nis_taken', 'NIS ini sudah terdaftar di sekolah ini. Pilih "Masuk".');
      }
      throw sErr;
    }
    const secrets = await hashPin(klass.school_id, nis, pin);
    const { error: secErr } = await db.from('student_secrets').insert({ student_id: userId, ...secrets });
    if (secErr) throw secErr;
    const { error: stErr } = await db.from('student_state').insert({ student_id: userId });
    if (stErr) throw stErr;
  } catch (e) {
    await db.auth.admin.deleteUser(userId).catch(() => {});
    throw e;
  }

  await logEvent({ school_id: klass.school_id, student_id: userId, nis, event: 'register', ip_hash: hmacKey(ip) });

  const session = await issueSession(email, ip);
  return json(201, { session, student: await studentPayload(userId) });
}

// ---------------------------------------------------------------------------
// POST /api/auth/login  (cukup NIS + PIN; Kode Sekolah hanya bila bentrok, D17)
// ---------------------------------------------------------------------------
async function login(request) {
  const ip = clientIp(request);
  const body = await readJson(request);

  await rateLimit('login_ip', ip, 60, 600);
  await verifyCaptcha(body.captchaToken, ip);

  const nis = normalizeNis(body.nis);
  const pin = str(body.pin, 10);
  const schoolCode = body.schoolCode ? normalizeCode(body.schoolCode) : '';

  if (!isValidNis(nis) || !/^\d{6}$/.test(pin)) {
    await dummyVerify();
    throw new HttpError(401, 'invalid_credentials', GENERIC_LOGIN_ERROR);
  }
  await rateLimit('login_nis', nis, 30, 600);

  const db = admin();
  let schoolFilter = null;
  if (schoolCode) {
    if (!isValidCode(schoolCode)) throw new HttpError(400, 'invalid_school_code', 'Kode Sekolah harus 6 karakter.');
    const { data: school } = await db
      .from('schools').select('id').eq('school_code', schoolCode).eq('status', 'active').maybeSingle();
    if (!school) {
      await dummyVerify();
      throw new HttpError(401, 'invalid_credentials', 'NIS, PIN, atau Kode Sekolah salah.');
    }
    schoolFilter = school.id;
  }

  let query = db
    .from('students')
    .select('id, school_id, nis, locked_until, student_secrets(pin_hash, pin_salt)')
    .eq('nis', nis)
    .eq('status', 'active')
    .limit(MAX_CANDIDATES + 1);
  if (schoolFilter) query = query.eq('school_id', schoolFilter);
  const { data: candidates, error } = await query;
  if (error) throw error;

  if (!candidates.length) {
    await dummyVerify();
    await logEvent({ nis, event: 'login_fail', ip_hash: hmacKey(ip), detail: { reason: 'not_found' } });
    throw new HttpError(401, 'invalid_credentials', GENERIC_LOGIN_ERROR);
  }
  if (candidates.length > MAX_CANDIDATES) {
    throw new HttpError(409, 'school_code_required',
      'NIS ini dipakai di beberapa sekolah. Masukkan Kode Sekolah untuk melanjutkan.', { needSchoolCode: true });
  }

  const now = Date.now();
  const unlocked = candidates.filter((c) => !c.locked_until || new Date(c.locked_until).getTime() <= now);
  if (!unlocked.length) {
    const until = candidates.map((c) => new Date(c.locked_until).getTime()).sort((a, b) => a - b)[0];
    const minutes = Math.max(1, Math.ceil((until - now) / 60000));
    throw new HttpError(423, 'account_locked',
      `Akun terkunci karena terlalu banyak PIN salah. Coba lagi dalam ${minutes} menit atau minta guru membukanya.`,
      { lockedMinutes: minutes });
  }

  const matches = [];
  for (const c of unlocked) {
    const secret = Array.isArray(c.student_secrets) ? c.student_secrets[0] : c.student_secrets;
    if (secret && (await verifyPin(c.school_id, c.nis, pin, secret))) matches.push(c);
  }

  if (matches.length > 1) {
    throw new HttpError(409, 'school_code_required',
      'Masukkan Kode Sekolah untuk melanjutkan.', { needSchoolCode: true });
  }

  if (matches.length === 0) {
    let lockedNow = false;
    for (const c of unlocked) {
      const { data: res } = await db.rpc('record_login_failure', { p_student: c.id });
      const row = Array.isArray(res) ? res[0] : res;
      if (row?.locked_until) {
        lockedNow = true;
        await logEvent({ school_id: c.school_id, student_id: c.id, nis, event: 'locked', ip_hash: hmacKey(ip) });
      }
    }
    await logEvent({ nis, event: 'login_fail', ip_hash: hmacKey(ip), detail: { candidates: unlocked.length } });
    if (lockedNow && unlocked.length === 1) {
      throw new HttpError(423, 'account_locked',
        'PIN salah 5 kali. Akun terkunci 15 menit. Coba lagi nanti atau minta guru membukanya.', { lockedMinutes: 15 });
    }
    throw new HttpError(401, 'invalid_credentials', GENERIC_LOGIN_ERROR);
  }

  const student = matches[0];
  await db.rpc('record_login_success', { p_student: student.id });
  await logEvent({ school_id: student.school_id, student_id: student.id, nis, event: 'login_ok', ip_hash: hmacKey(ip) });

  const { data: authUser, error: uErr } = await db.auth.admin.getUserById(student.id);
  if (uErr || !authUser?.user?.email) throw new HttpError(503, 'session_unavailable', 'Gagal membuat sesi.');

  const session = await issueSession(authUser.user.email, ip);
  return json(200, { session, student: await studentPayload(student.id) });
}

// ---------------------------------------------------------------------------
// POST /api/auth/change-pin  (butuh sesi; PIN lama wajib kecuali must_change_pin)
// ---------------------------------------------------------------------------
async function changePin(request) {
  const ip = clientIp(request);
  const user = await userFromToken(bearerToken(request));
  const body = await readJson(request);
  await rateLimit('change_pin_user', user.id, 10, 3600);

  const db = admin();
  const { data: s, error } = await db
    .from('students')
    .select('id, school_id, nis, must_change_pin, status, student_secrets(pin_hash, pin_salt)')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (!s || s.status !== 'active') throw new HttpError(403, 'forbidden', 'Akun ini tidak bisa mengganti PIN.');

  const newPin = str(body.newPin, 10);
  if (str(body.newPinConfirm, 10) !== newPin) throw new HttpError(400, 'pin_mismatch', 'Konfirmasi PIN tidak sama.');
  const weak = pinPolicyError(newPin, s.nis);
  if (weak) throw new HttpError(400, 'weak_pin', weak);

  const secret = Array.isArray(s.student_secrets) ? s.student_secrets[0] : s.student_secrets;
  if (!s.must_change_pin) {
    const ok = secret && (await verifyPin(s.school_id, s.nis, str(body.oldPin, 10), secret));
    if (!ok) throw new HttpError(401, 'invalid_old_pin', 'PIN lama salah.');
  }
  if (secret && (await verifyPin(s.school_id, s.nis, newPin, secret))) {
    throw new HttpError(400, 'same_pin', 'PIN baru harus berbeda dari PIN sebelumnya.');
  }

  const hashed = await hashPin(s.school_id, s.nis, newPin);
  const { error: upErr } = await db
    .from('student_secrets').update({ ...hashed, failed_attempts: 0, updated_at: new Date().toISOString() })
    .eq('student_id', s.id);
  if (upErr) throw upErr;
  const { error: flagErr } = await db.from('students').update({ must_change_pin: false }).eq('id', s.id);
  if (flagErr) throw flagErr;

  await logEvent({ school_id: s.school_id, student_id: s.id, nis: s.nis, event: 'change_pin', ip_hash: hmacKey(ip) });
  return json(200, { ok: true });
}

export const authRoutes = {
  'auth/register': { POST: register },
  'auth/login': { POST: login },
  'auth/change-pin': { POST: changePin },
};
