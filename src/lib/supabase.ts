// Klien Supabase untuk browser (area siswa). Hanya memakai kunci PUBLIK.
// storageKey khusus siswa supaya tidak bentrok dengan sesi guru/admin di Fase 2 (spec 3.8).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** false bila env belum diisi: aplikasi tetap berjalan penuh dalam mode lokal. */
export const isOnlineConfigured = Boolean(url && publishableKey);

export const studentClient: SupabaseClient | null = isOnlineConfigured
  ? createClient(url!, publishableKey!, {
      auth: {
        storageKey: 'emodul-student-auth',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '';
