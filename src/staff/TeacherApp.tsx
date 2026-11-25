// Halaman /guru: login Google, aktivasi kode dari admin, lalu dashboard kelas dan siswa (spec 3.5, 7).

import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound, Loader2, Plus, RefreshCw, School, Users } from 'lucide-react';
import { staffApi, staffClient, staffConfigured } from './staffClient';
import { useStaffAuth } from './useStaffAuth';
import { CopyButton, Notice, StaffShell } from './StaffShell';
import { StudentManager } from './StudentManager';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
  </svg>
);

const SignInCard: React.FC<{ error: string }> = ({ error }) => {
  const [busy, setBusy] = useState(false);
  const signIn = async () => {
    setBusy(true);
    await staffClient?.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/guru`, queryParams: { prompt: 'select_account' } },
    });
  };
  return (
    <section className="card p-6 sm:p-8 max-w-lg mx-auto space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-display font-bold text-slate-900">Masuk sebagai Guru</h1>
        <p className="text-sm text-slate-600">Gunakan akun Google Anda. Saat pertama kali masuk, Anda akan diminta kode aktivasi dari admin.</p>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <button type="button" onClick={() => void signIn()} disabled={busy} className="btn btn-secondary w-full px-5 py-3 text-base">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <GoogleIcon />}
        <span>Masuk dengan Google</span>
      </button>
      <p className="text-xs text-slate-500 text-center">Siswa? <a href="/" className="font-semibold text-brand-700 underline">Buka halaman siswa</a></p>
    </section>
  );
};

const ActivationCard: React.FC<{ email: string; onActivated: () => Promise<void>; onSignOut: () => void }> = ({ email, onActivated, onSignOut }) => {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const clean = code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
  const shown = clean.length > 5 ? `${clean.slice(0, 5)}-${clean.slice(5)}` : clean;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await staffApi('teacher/activate', { code: clean });
      await onActivated();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };
  return (
    <section className="card p-6 sm:p-8 max-w-lg mx-auto space-y-5">
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-display font-bold text-slate-900">
          <KeyRound className="w-6 h-6 text-brand-700" aria-hidden="true" /> Aktivasi Akun Guru
        </h1>
        <p className="text-sm text-slate-600">
          Masuk sebagai <strong className="text-slate-900">{email}</strong>. Masukkan kode aktivasi 10 karakter yang dikirim admin.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label htmlFor="activation-code" className="block space-y-1.5">
          <span className="text-xs font-bold text-slate-700">Kode aktivasi</span>
          <input id="activation-code" value={shown} onChange={(e) => setCode(e.target.value)} placeholder="ABCDE-23456"
            autoComplete="off" spellCheck={false} className="input w-full px-4 py-3 text-lg font-mono tracking-widest text-center" />
        </label>
        {error && <Notice tone="error">{error}</Notice>}
        <button type="submit" disabled={busy || clean.length !== 10} className="btn btn-primary w-full px-5 py-3 text-base">
          {busy && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />} Aktifkan
        </button>
      </form>
      <p className="text-xs text-slate-500 text-center">
        Bukan akun ini? <button type="button" onClick={onSignOut} className="font-semibold text-brand-700 underline cursor-pointer">Ganti akun Google</button>
      </p>
    </section>
  );
};

interface ClassRow { id: string; name: string; join_code: string; created_at: string }

const TeacherDashboard: React.FC<{ schoolId: string; schoolName: string; schoolCode: string; userId: string }> = ({ schoolId, schoolName, schoolCode, userId }) => {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'class' | 'search'>('class');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    const { data, error: err } = await staffClient!
      .from('classes').select('id, name, join_code, created_at').eq('school_id', schoolId).eq('archived', false).order('created_at');
    if (err) setError('Gagal memuat kelas.');
    const list = (data ?? []) as ClassRow[];
    setClasses(list);
    setSelected((cur) => (cur && list.some((c) => c.id === cur) ? cur : list[0]?.id ?? ''));
  }, [schoolId]);

  useEffect(() => {
    void load();
  }, [load]);

  const createClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.replace(/\s+/g, ' ').trim();
    if (!name) return;
    setBusy(true);
    setError('');
    const { data, error: err } = await staffClient!
      .from('classes').insert({ school_id: schoolId, teacher_id: userId, name }).select('id').single();
    setBusy(false);
    if (err) {
      setError('Gagal membuat kelas.');
      return;
    }
    setNewName('');
    await load();
    setSelected(data.id);
  };

  const rotate = async (klass: ClassRow) => {
    if (!window.confirm(`Ganti kode kelas ${klass.name}? Kode lama langsung tidak berlaku untuk pendaftaran baru. Siswa yang sudah terdaftar tidak terpengaruh.`)) return;
    try {
      await staffApi('teacher/rotate-join-code', { classId: klass.id });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const current = classes.find((c) => c.id === selected);

  return (
    <div className="space-y-6">
      <section className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <School className="w-6 h-6 text-brand-700 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h1 className="text-lg font-display font-bold text-slate-900 truncate">{schoolName}</h1>
            <p className="text-xs text-slate-600">Kode Sekolah <span className="font-mono font-semibold text-slate-900">{schoolCode}</span> · dipakai siswa bila diminta saat masuk</p>
          </div>
        </div>
        <CopyButton value={schoolCode} label="Salin Kode Sekolah" />
      </section>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
        <aside className="card p-4 space-y-4">
          <div className="flex gap-1 p-1 rounded-lg bg-slate-100" role="tablist">
            <button type="button" role="tab" aria-selected={view === 'class'} onClick={() => setView('class')}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${view === 'class' ? 'bg-white text-brand-700 border border-slate-200' : 'text-slate-600'}`}>Kelas</button>
            <button type="button" role="tab" aria-selected={view === 'search'} onClick={() => setView('search')}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${view === 'search' ? 'bg-white text-brand-700 border border-slate-200' : 'text-slate-600'}`}>Cari NIS</button>
          </div>
          <nav aria-label="Daftar kelas" className="space-y-1">
            {classes.length === 0 && <p className="text-xs text-slate-600">Belum ada kelas. Buat kelas pertama di bawah.</p>}
            {classes.map((c) => (
              <button key={c.id} type="button" onClick={() => { setSelected(c.id); setView('class'); }}
                aria-current={view === 'class' && c.id === selected ? 'page' : undefined}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${view === 'class' && c.id === selected ? 'bg-brand-50 text-brand-800 font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}>
                {c.name}
              </button>
            ))}
          </nav>
          <form onSubmit={createClass} className="space-y-2 pt-3 border-t border-slate-200">
            <label htmlFor="new-class" className="text-xs font-bold text-slate-700">Kelas baru</label>
            <input id="new-class" value={newName} onChange={(e) => setNewName(e.target.value.slice(0, 80))} placeholder="Contoh: XII MIPA 1" className="input w-full px-3 py-2 text-sm" />
            <button type="submit" disabled={busy || !newName.trim()} className="btn btn-primary w-full px-3 py-2 text-sm">
              <Plus className="w-4 h-4" aria-hidden="true" /> Buat Kelas
            </button>
          </form>
        </aside>

        <section className="card p-5 space-y-5 min-w-0">
          {view === 'search' ? (
            <>
              <label htmlFor="search-nis" className="block space-y-1.5">
                <span className="text-sm font-display font-bold text-slate-900">Cari siswa di sekolah ini berdasarkan NIS</span>
                <input id="search-nis" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Minimal 3 karakter" className="input w-full px-3 py-2 text-sm font-mono" />
              </label>
              <StudentManager key={`q-${query}`} nisQuery={query} />
            </>
          ) : current ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-700" aria-hidden="true" />
                  <h2 className="text-lg font-display font-bold text-slate-900">{current.name}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-600">Kode kelas</span>
                  <span className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 font-mono text-lg font-bold tracking-widest text-slate-900">{current.join_code}</span>
                  <CopyButton value={current.join_code} />
                  <button type="button" onClick={() => void rotate(current)} className="btn btn-secondary px-3 min-h-0 h-8 text-xs">
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Ganti kode
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-600">Siswa mendaftar di halaman utama: pilih <strong>Daftar Baru</strong>, isi kode kelas di atas, NIS, nama, kelompok, dan PIN.</p>
              <StudentManager key={current.id} classId={current.id} />
            </>
          ) : (
            <Notice>Buat kelas untuk mendapatkan kode kelas yang dibagikan ke siswa.</Notice>
          )}
        </section>
      </div>
    </div>
  );
};

export default function TeacherApp() {
  const auth = useStaffAuth();
  const { status, session, me, error, refreshMe, signOut } = auth;

  let body: React.ReactNode;
  if (!staffConfigured) {
    body = <Notice tone="error">Server belum dikonfigurasi (variabel VITE_SUPABASE_* kosong).</Notice>;
  } else if (status === 'loading' || (status === 'signedIn' && !me && !error)) {
    body = <p role="status" className="text-sm text-slate-600">Memeriksa sesi...</p>;
  } else if (status === 'signedOut') {
    body = <SignInCard error={error} />;
  } else if (!me) {
    body = <Notice tone="error">{error || 'Gagal memuat akun.'}</Notice>;
  } else if (me.isStudent) {
    body = <Notice tone="error">Akun ini adalah akun siswa. Keluar lalu masuk dengan akun Google guru.</Notice>;
  } else if (!me.profile) {
    body = <ActivationCard email={me.email} onActivated={refreshMe} onSignOut={() => void signOut()} />;
  } else if (me.profile.status !== 'active') {
    body = <Notice tone="error">Akun guru ini dinonaktifkan admin. Hubungi admin bila ini keliru.</Notice>;
  } else if (me.profile.role === 'admin') {
    body = <Notice>Akun ini adalah admin. <a href="/admin" className="font-semibold text-brand-700 underline">Buka panel admin</a>.</Notice>;
  } else if (me.school && session) {
    body = <TeacherDashboard schoolId={me.school.id} schoolName={me.school.name} schoolCode={me.school.school_code} userId={session.user.id} />;
  } else {
    body = <Notice tone="error">Data sekolah tidak ditemukan. Hubungi admin.</Notice>;
  }

  return (
    <StaffShell title="Halaman Guru" subtitle="E-Modul Induksi Elektromagnetik" email={me?.email}
      onSignOut={status === 'signedIn' ? () => void signOut() : undefined}>
      {body}
    </StaffShell>
  );
}
