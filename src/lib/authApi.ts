// Pemanggil endpoint akun siswa (api/_lib/auth-routes.js).

export interface StudentProfile {
  id: string;
  nis: string;
  name: string;
  mustChangePin: boolean;
  schoolName: string;
  schoolCode: string;
  className: string;
  groupName: string;
}

export interface AuthResult {
  session: { access_token: string; refresh_token: string; expires_at?: number };
  student: StudentProfile;
}

export class ApiError extends Error {
  code: string;
  status: number;
  needSchoolCode: boolean;
  constructor(status: number, code: string, message: string, needSchoolCode = false) {
    super(message);
    this.status = status;
    this.code = code;
    this.needSchoolCode = needSchoolCode;
  }
}

async function post<T>(path: string, body: unknown, accessToken?: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'network_error', 'Tidak bisa terhubung ke server. Periksa koneksi internet.');
  }
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    // respons bukan JSON
  }
  if (!res.ok) {
    throw new ApiError(
      res.status,
      String(data.error ?? 'unknown_error'),
      String(data.message ?? 'Terjadi kesalahan. Coba lagi.'),
      Boolean(data.needSchoolCode),
    );
  }
  return data as T;
}

export function registerStudent(input: {
  classCode: string;
  nis: string;
  name: string;
  groupName: string;
  pin: string;
  pinConfirm: string;
  captchaToken: string;
}): Promise<AuthResult> {
  return post<AuthResult>('/api/auth/register', input);
}

export function loginStudent(input: { nis: string; pin: string; schoolCode?: string; captchaToken: string }): Promise<AuthResult> {
  return post<AuthResult>('/api/auth/login', input);
}

export function changeStudentPin(
  accessToken: string,
  input: { oldPin?: string; newPin: string; newPinConfirm: string },
): Promise<{ ok: true }> {
  return post('/api/auth/change-pin', input, accessToken);
}
