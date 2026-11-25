import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { staffApi, staffClient, type StaffMe } from './staffClient';

export type StaffStatus = 'loading' | 'signedOut' | 'signedIn';

/** Pesan galat dari redirect OAuth (mis. ?error_description=...), lalu URL dibersihkan. */
function takeOAuthError(): string {
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const desc = params.get('error_description') ?? hash.get('error_description');
  if (params.has('error') || hash.has('error')) {
    window.history.replaceState(null, '', window.location.pathname);
  }
  if (!desc) return '';
  if (/signups? not allowed/i.test(desc)) {
    return 'Pendaftaran akun Google baru sedang ditutup di server. Hubungi admin (pengaturan Auth Supabase).';
  }
  return desc.replace(/\+/g, ' ');
}

export function useStaffAuth() {
  const [status, setStatus] = useState<StaffStatus>(staffClient ? 'loading' : 'signedOut');
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<StaffMe | null>(null);
  const [error, setError] = useState(() => takeOAuthError());

  const refreshMe = useCallback(async () => {
    try {
      setMe(await staffApi<StaffMe>('teacher/me'));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    const client = staffClient;
    if (!client) return;
    let active = true;
    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setStatus(data.session ? 'signedIn' : 'signedOut');
    });
    const { data: sub } = client.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setStatus(s ? 'signedIn' : 'signedOut');
      if (!s) setMe(null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (userId) void refreshMe();
  }, [userId, refreshMe]);

  const signOut = useCallback(async () => {
    await staffClient?.auth.signOut({ scope: 'local' });
    setMe(null);
  }, []);

  return { status, session, me, error, setError, refreshMe, signOut };
}
