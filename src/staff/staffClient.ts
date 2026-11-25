// Klien Supabase untuk area guru/admin. storageKey terpisah dari sesi siswa (spec 3.8),
// sehingga guru yang mencoba login siswa di browser yang sama tidak kehilangan sesinya.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../lib/authApi';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const staffConfigured = Boolean(url && publishableKey);

export const staffClient: SupabaseClient | null = staffConfigured
  ? createClient(url!, publishableKey!, {
      auth: {
        storageKey: 'emodul-staff-auth',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // menyelesaikan login Google (PKCE) saat kembali ke /guru
        flowType: 'pkce',
      },
    })
  : null;

/** Panggil endpoint /api/<route> atas nama staf yang sedang masuk. */
export async function staffApi<T>(route: string, body?: unknown): Promise<T> {
  const token = (await staffClient?.auth.getSession())?.data.session?.access_token;
  if (!token) throw new ApiError(401, 'unauthenticated', 'Sesi berakhir. Silakan masuk lagi.');
  let res: Response;
  try {
    res = await fetch(`/api/${route}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'network_error', 'Tidak bisa terhubung ke server. Periksa koneksi internet.');
  }
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    // bukan JSON
  }
  if (!res.ok) throw new ApiError(res.status, String(data.error ?? 'unknown_error'), String(data.message ?? 'Terjadi kesalahan.'));
  return data as T;
}

export interface StaffMe {
  email: string;
  isStudent: boolean;
  profile: { role: 'teacher' | 'admin'; status: 'active' | 'disabled'; schoolId: string | null; displayName: string | null } | null;
  school: { id: string; name: string; school_code: string; city: string | null; npsn: string | null; is_test: boolean } | null;
}
