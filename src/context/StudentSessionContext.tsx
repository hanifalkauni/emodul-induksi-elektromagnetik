// Sesi siswa (NIS + PIN). Sesi Supabase diterbitkan server (/api/auth/*) lalu dipasang di klien.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isOnlineConfigured, studentClient } from '../lib/supabase';
import { changeStudentPin, loginStudent, registerStudent, type StudentProfile } from '../lib/authApi';

const MODE_KEY = 'emodul_mode';
const SCHOOL_CODE_KEY = 'emodul_school_code';

export type SessionStatus = 'loading' | 'signedOut' | 'signedIn';
export type AppMode = 'online' | 'local';

interface StudentSessionValue {
  configured: boolean;
  status: SessionStatus;
  profile: StudentProfile | null;
  userId: string | null;
  mode: AppMode;
  rememberedSchoolCode: string;
  chooseMode: (mode: AppMode) => void;
  login: (input: { nis: string; pin: string; schoolCode?: string; captchaToken: string }) => Promise<void>;
  register: (input: {
    classCode: string; nis: string; name: string; groupName: string; pin: string; pinConfirm: string; captchaToken: string;
  }) => Promise<void>;
  changePin: (input: { oldPin?: string; newPin: string; newPinConfirm: string }) => Promise<void>;
  /** Tutup kewajiban ganti PIN setelah siswa melihat pesan sukses. */
  acknowledgePinChanged: () => void;
  signOut: () => Promise<void>;
  forgetSchoolCode: () => void;
}

const StudentSessionContext = createContext<StudentSessionValue | undefined>(undefined);

function readLocal(key: string, fallback = ''): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // abaikan
  }
}

async function fetchProfile(client: SupabaseClient, uid: string): Promise<StudentProfile | null> {
  const { data: s, error } = await client
    .from('students')
    .select('id, nis, student_name, must_change_pin, school_id, class_id, group_id')
    .eq('id', uid)
    .maybeSingle();
  if (error || !s) return null;
  const [school, klass, group] = await Promise.all([
    client.from('schools').select('name, school_code').eq('id', s.school_id).maybeSingle(),
    s.class_id ? client.from('classes').select('name').eq('id', s.class_id).maybeSingle() : Promise.resolve({ data: null }),
    s.group_id ? client.from('groups').select('name').eq('id', s.group_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return {
    id: s.id,
    nis: s.nis,
    name: s.student_name,
    mustChangePin: s.must_change_pin,
    schoolName: school.data?.name ?? '',
    schoolCode: school.data?.school_code ?? '',
    className: (klass.data as { name?: string } | null)?.name ?? '',
    groupName: (group.data as { name?: string } | null)?.name ?? '',
    groupId: s.group_id ?? null,
  };
}

export const StudentSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<SessionStatus>(isOnlineConfigured ? 'loading' : 'signedOut');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [mode, setMode] = useState<AppMode>(() =>
    !isOnlineConfigured || readLocal(MODE_KEY) === 'local' ? 'local' : 'online',
  );
  const [rememberedSchoolCode, setRememberedSchoolCode] = useState(() => readLocal(SCHOOL_CODE_KEY));

  useEffect(() => {
    const client = studentClient;
    if (!client) return;
    let active = true;

    client.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const session = data.session;
      if (!session) {
        setStatus('signedOut');
        return;
      }
      const p = await fetchProfile(client, session.user.id);
      if (!active) return;
      if (!p) {
        // Sesi bukan milik siswa aktif (dinonaktifkan atau akun staf): keluarkan
        await client.auth.signOut({ scope: 'local' });
        setStatus('signedOut');
        return;
      }
      setAccessToken(session.access_token);
      setProfile(p);
      setStatus('signedIn');
    });

    const { data: sub } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setProfile(null);
        setAccessToken(null);
        setStatus('signedOut');
      } else {
        setAccessToken(session.access_token);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const adopt = useCallback(async (result: Awaited<ReturnType<typeof loginStudent>>) => {
    if (!studentClient) throw new Error('Mode online belum dikonfigurasi.');
    const { error } = await studentClient.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });
    if (error) throw new Error('Sesi tidak bisa dipasang. Coba masuk lagi.');
    writeLocal(SCHOOL_CODE_KEY, result.student.schoolCode);
    writeLocal(MODE_KEY, 'online');
    setRememberedSchoolCode(result.student.schoolCode);
    setMode('online');
    setAccessToken(result.session.access_token);
    setProfile(result.student);
    setStatus('signedIn');
  }, []);

  const login = useCallback<StudentSessionValue['login']>(
    async (input) => adopt(await loginStudent(input)),
    [adopt],
  );

  const register = useCallback<StudentSessionValue['register']>(
    async (input) => adopt(await registerStudent(input)),
    [adopt],
  );

  const changePin = useCallback<StudentSessionValue['changePin']>(
    async (input) => {
      const token = (await studentClient?.auth.getSession())?.data.session?.access_token ?? accessToken;
      if (!token) throw new Error('Sesi berakhir. Silakan masuk lagi.');
      await changeStudentPin(token, input);
      // Status must_change_pin dibersihkan lewat acknowledgePinChanged() setelah siswa membaca pesan sukses.
    },
    [accessToken],
  );

  const acknowledgePinChanged = useCallback(() => {
    setProfile((p) => (p ? { ...p, mustChangePin: false } : p));
  }, []);

  const signOut = useCallback(async () => {
    await studentClient?.auth.signOut({ scope: 'local' });
    setProfile(null);
    setAccessToken(null);
    setStatus('signedOut');
  }, []);

  const chooseMode = useCallback((next: AppMode) => {
    writeLocal(MODE_KEY, next);
    setMode(next);
  }, []);

  const forgetSchoolCode = useCallback(() => {
    writeLocal(SCHOOL_CODE_KEY, null);
    setRememberedSchoolCode('');
  }, []);

  const value = useMemo<StudentSessionValue>(
    () => ({
      configured: isOnlineConfigured,
      status,
      profile,
      userId: status === 'signedIn' ? profile?.id ?? null : null,
      mode,
      rememberedSchoolCode,
      chooseMode,
      login,
      register,
      changePin,
      acknowledgePinChanged,
      signOut,
      forgetSchoolCode,
    }),
    [status, profile, mode, rememberedSchoolCode, chooseMode, login, register, changePin, acknowledgePinChanged, signOut, forgetSchoolCode],
  );

  return <StudentSessionContext.Provider value={value}>{children}</StudentSessionContext.Provider>;
};

export function useStudentSession(): StudentSessionValue {
  const ctx = useContext(StudentSessionContext);
  if (!ctx) throw new Error('useStudentSession harus dipakai di dalam StudentSessionProvider');
  return ctx;
}
