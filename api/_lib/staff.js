// Otorisasi staf (guru/admin). Peran SELALU dibaca dari database di server, tidak dari klien (spec 3.8).

import { HttpError, bearerToken } from './http.js';
import { admin, userFromToken } from './supabase.js';

/** Pengguna yang login (Google/email) beserta profil stafnya bila ada. */
export async function currentStaffUser(request) {
  const user = await userFromToken(bearerToken(request));
  const { data: profile, error } = await admin()
    .from('profiles')
    .select('user_id, role, status, school_id, email, display_name')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return { user, profile };
}

/** Guru aktif atau admin. */
export async function requireStaff(request) {
  const { user, profile } = await currentStaffUser(request);
  if (!profile) throw new HttpError(403, 'not_activated', 'Akun ini belum diaktifkan. Masukkan kode aktivasi dari admin.');
  if (profile.status !== 'active') throw new HttpError(403, 'staff_disabled', 'Akun guru ini dinonaktifkan. Hubungi admin.');
  return { user, profile, isAdmin: profile.role === 'admin' };
}

export async function requireAdmin(request) {
  const staff = await requireStaff(request);
  if (!staff.isAdmin) throw new HttpError(403, 'forbidden', 'Hanya admin yang bisa melakukan ini.');
  return staff;
}

/** Guru hanya boleh menyentuh sekolahnya sendiri; admin semua sekolah. */
export function assertSchoolAccess(staff, schoolId) {
  if (staff.isAdmin) return;
  if (!schoolId || schoolId !== staff.profile.school_id) {
    // 404 (bukan 403) agar keberadaan data sekolah lain tidak terbuka
    throw new HttpError(404, 'not_found', 'Data tidak ditemukan.');
  }
}

export async function loadStudentForStaff(staff, studentId) {
  if (typeof studentId !== 'string' || !/^[0-9a-f-]{36}$/i.test(studentId)) {
    throw new HttpError(400, 'invalid_student', 'ID siswa tidak valid.');
  }
  const { data, error } = await admin()
    .from('students')
    .select('id, school_id, class_id, group_id, nis, student_name, status, locked_until, must_change_pin')
    .eq('id', studentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'not_found', 'Siswa tidak ditemukan.');
  assertSchoolAccess(staff, data.school_id);
  return data;
}

export async function loadClassForStaff(staff, classId) {
  if (typeof classId !== 'string' || !/^[0-9a-f-]{36}$/i.test(classId)) {
    throw new HttpError(400, 'invalid_class', 'ID kelas tidak valid.');
  }
  const { data, error } = await admin().from('classes').select('id, school_id, name, join_code, archived').eq('id', classId).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'not_found', 'Kelas tidak ditemukan.');
  assertSchoolAccess(staff, data.school_id);
  return data;
}

export function isUuid(v) {
  return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
