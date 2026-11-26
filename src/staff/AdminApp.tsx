// Halaman /admin: login email + password, kode aktivasi guru, sekolah, guru, bantuan siswa (spec 3.5, 7.1).

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyRound, Loader2, Plus, RefreshCw, School, ShieldCheck, Users, LifeBuoy, Pencil, Activity } from 'lucide-react';
import { staffApi, staffClient, staffConfigured } from './staffClient';
import { useStaffAuth } from './useStaffAuth';
import { CopyButton, Modal, Notice, StaffShell, formatDateTime } from './StaffShell';
import { StudentManager } from './StudentManager';
import { OpsTab } from './OpsTab';

const DAY_OPTIONS = [3, 7, 14, 30, 60, 90];
const USE_OPTIONS: { value: string; label: string }[] = [
  { value: '1', label: '1 guru' },
  { value: '5', label: '5 guru' },
  { value: '10', label: '10 guru' },
  { value: '30', label: '30 guru (bawaan)' },
  { value: '100', label: '100 guru' },
  { value: 'unlimited', label: 'Tanpa batas' },
];

interface SchoolRow { id: string; name: string; school_code: string; npsn: string | null; city: string | null; is_test: boolean }
interface InviteRow {
  id: string; schoolName: string; schoolCode: string | null; newSchool: boolean; boundEmail: string | null;
  expiresAt: string; maxUses: number | null; useCount: number; revoked: boolean; createdAt: string;
  state: 'active' | 'expired' | 'exhausted' | 'revoked';
  redemptions: { email: string; redeemedAt: string; userId: string }[];
}
interface TeacherRow { userId: string; email: string; status: 'active' | 'disabled'; schoolName: string; createdAt: string; isNew: boolean }

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }> = ({ label, hint, id, ...rest }) => (
  <label htmlFor={id} className="block space-y-1">
    <span className="text-xs font-bold text-slate-700">{label}</span>
    <input id={id} {...rest} className={`input w-full px-3 py-2 text-sm ${rest.className ?? ''}`} />
    {hint && <span className="block text-[11px] text-slate-500">{hint}</span>}
  </label>
);

// ---------------------------------------------------------------------------
const SignIn: React.FC<{ error: string }> = ({ error: oauthError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(oauthError);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error: err } = await staffClient!.auth.signInWithPassword({ email: email.trim(), password });
    if (err) setError(err.status === 429 ? 'Terlalu banyak percobaan. Tunggu beberapa menit.' : 'Email atau password salah.');
    setBusy(false);
  };
  return (
    <section className="card p-6 sm:p-8 max-w-md mx-auto space-y-5">
      <h1 className="flex items-center gap-2 text-2xl font-display font-bold text-slate-900">
        <ShieldCheck className="w-6 h-6 text-brand-700" aria-hidden="true" /> Masuk Admin
      </h1>
      <form onSubmit={submit} className="space-y-4">
        <Input id="admin-email" label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input id="admin-password" label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <Notice tone="error">{error}</Notice>}
        <button type="submit" disabled={busy || !email || !password} className="btn btn-primary w-full px-5 py-3 text-base">
          {busy && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />} Masuk
        </button>
      </form>
    </section>
  );
};

// ---------------------------------------------------------------------------
const InvitesTab: React.FC<{ schools: SchoolRow[]; onChanged: () => void }> = ({ schools, onChanged }) => {
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [schoolId, setSchoolId] = useState('');
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newNpsn, setNewNpsn] = useState('');
  const [email, setEmail] = useState('');
  const [days, setDays] = useState(14);
  const [maxUses, setMaxUses] = useState('30');
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<{ code: string; expiresAt: string; schoolName: string } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  /** true setelah admin memilih sendiri "Sekolah terdaftar"/"Sekolah baru"; pilihan otomatis berhenti. */
  const modeChosen = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setInvites((await staffApi<{ invites: InviteRow[] }>('admin/invites')).invites);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!schoolId && schools.length) setSchoolId(schools[0].id);
    // Daftar sekolah dimuat belakangan: pilih otomatis sesuai isinya sampai admin memilih sendiri
    if (!modeChosen.current) setMode(schools.length ? 'existing' : 'new');
  }, [schools, schoolId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = {
        ...(mode === 'existing' ? { schoolId } : { newSchool: { name: newName, city: newCity, npsn: newNpsn } }),
        boundEmail: email || undefined,
        days,
        maxUses: maxUses === 'unlimited' ? 'unlimited' : Number(maxUses),
      };
      const res = await staffApi<{ code: string; expiresAt: string }>('admin/invites', body);
      setIssued({ ...res, schoolName: mode === 'existing' ? schools.find((s) => s.id === schoolId)?.name ?? '' : newName });
      setEmail('');
      setNewName(''); setNewCity(''); setNewNpsn('');
      await load();
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  };

  const revoke = async (inv: InviteRow) => {
    if (!window.confirm('Cabut kode ini? Guru yang sudah aktif tidak otomatis keluar; nonaktifkan di tab Guru bila perlu.')) return;
    try { await staffApi('admin/invites/revoke', { inviteId: inv.id }); await load(); } catch (e) { setError((e as Error).message); }
  };
  const extend = async (inv: InviteRow) => {
    try { await staffApi('admin/invites/extend', { inviteId: inv.id, days: 14 }); await load(); } catch (e) { setError((e as Error).message); }
  };

  const riskyNoEmail = !email && days > 7;
  const stateLabel: Record<InviteRow['state'], [string, string]> = {
    active: ['Aktif', 'bg-emerald-50 text-emerald-800'],
    expired: ['Kedaluwarsa', 'bg-slate-100 text-slate-700'],
    exhausted: ['Batas tercapai', 'bg-amber-50 text-amber-800'],
    revoked: ['Dicabut', 'bg-rose-50 text-rose-700'],
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="card p-5 space-y-4">
        <h2 className="text-base font-display font-bold text-slate-900">Terbitkan kode aktivasi guru</h2>
        <div className="flex gap-1 p-1 rounded-lg bg-slate-100 max-w-sm" role="radiogroup" aria-label="Sekolah tujuan">
          {(['existing', 'new'] as const).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => { modeChosen.current = true; setMode(m); }} disabled={m === 'existing' && !schools.length}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${mode === m ? 'bg-white text-brand-700 border border-slate-200' : 'text-slate-600'}`}>
              {m === 'existing' ? 'Sekolah terdaftar' : 'Sekolah baru'}
            </button>
          ))}
        </div>
        {mode === 'existing' ? (
          <label htmlFor="inv-school" className="block space-y-1">
            <span className="text-xs font-bold text-slate-700">Sekolah</span>
            <select id="inv-school" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="input w-full px-3 py-2 text-sm">
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}{s.is_test ? ' (uji)' : ''}</option>)}
            </select>
          </label>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input id="inv-name" label="Nama sekolah" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="SMA Negeri 1 ..." />
            <Input id="inv-city" label="Kota (opsional)" value={newCity} onChange={(e) => setNewCity(e.target.value)} />
            <Input id="inv-npsn" label="NPSN (opsional)" value={newNpsn} onChange={(e) => setNewNpsn(e.target.value.replace(/\D/g, '').slice(0, 8))} inputMode="numeric" hint="Sekolah dibuat saat guru pertama menebus kode." />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input id="inv-email" label="Email Google guru (opsional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            hint="Bila diisi, kode hanya bisa dipakai akun Google ini." />
          <label htmlFor="inv-days" className="block space-y-1">
            <span className="text-xs font-bold text-slate-700">Masa berlaku</span>
            <select id="inv-days" value={days} onChange={(e) => setDays(Number(e.target.value))} className="input w-full px-3 py-2 text-sm">
              {DAY_OPTIONS.map((d) => <option key={d} value={d}>{d} hari</option>)}
            </select>
          </label>
          <label htmlFor="inv-uses" className="block space-y-1">
            <span className="text-xs font-bold text-slate-700">Batas pemakaian</span>
            <select id="inv-uses" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="input w-full px-3 py-2 text-sm">
              {USE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
        {riskyNoEmail && (
          <Notice tone="warning">Kode tanpa email dan berlaku lebih dari 7 hari bisa dipakai siapa pun yang mendapatkannya. Kirim hanya lewat chat pribadi atau grup kecil guru.</Notice>
        )}
        {error && <Notice tone="error">{error}</Notice>}
        <button type="submit" disabled={busy || (mode === 'existing' ? !schoolId : newName.trim().length < 3)} className="btn btn-primary px-5 py-2.5 text-sm">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Plus className="w-4 h-4" aria-hidden="true" />} Terbitkan kode
        </button>
      </form>

      <section className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-display font-bold text-slate-900">Kode yang sudah diterbitkan</h2>
          <button type="button" onClick={() => void load()} className="btn btn-secondary px-3 min-h-0 h-8 text-xs"><RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Muat ulang</button>
        </div>
        {loading ? <p className="text-sm text-slate-600">Memuat...</p> : invites.length === 0 ? <Notice>Belum ada kode.</Notice> : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
            {invites.map((inv) => {
              const [label, cls] = stateLabel[inv.state];
              return (
                <li key={inv.id} className="p-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">{inv.schoolName}</span>
                        {inv.newSchool && <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">sekolah baru</span>}
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${cls}`}>{label}</span>
                      </div>
                      <div className="text-xs text-slate-600 flex flex-wrap gap-x-3">
                        <span>Dipakai {inv.useCount}{inv.maxUses !== null ? `/${inv.maxUses}` : ' (tanpa batas)'}</span>
                        <span>Berlaku s.d. {formatDateTime(inv.expiresAt)}</span>
                        <span>{inv.boundEmail ? `Khusus ${inv.boundEmail}` : 'Tanpa ikatan email'}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {inv.redemptions.length > 0 && (
                        <button type="button" onClick={() => setOpen(open === inv.id ? null : inv.id)} aria-expanded={open === inv.id} className="btn btn-secondary px-3 min-h-0 h-8 text-xs">
                          Penebus ({inv.redemptions.length})
                        </button>
                      )}
                      {inv.state !== 'revoked' && (
                        <button type="button" onClick={() => void extend(inv)} className="btn btn-secondary px-3 min-h-0 h-8 text-xs">+14 hari</button>
                      )}
                      {inv.state !== 'revoked' && (
                        <button type="button" onClick={() => void revoke(inv)} className="btn btn-secondary px-3 min-h-0 h-8 text-xs hover:text-rose-700 hover:border-rose-300">Cabut</button>
                      )}
                    </div>
                  </div>
                  {open === inv.id && (
                    <ul className="pl-3 border-l-2 border-slate-200 space-y-0.5">
                      {inv.redemptions.map((r) => (
                        <li key={r.userId} className="text-xs text-slate-700">{r.email} <span className="text-slate-500">· {formatDateTime(r.redeemedAt)}</span></li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {issued && (
        <Modal title="Kode aktivasi baru" onClose={() => setIssued(null)}>
          <p className="text-sm text-slate-700">Kirim kode ini ke guru <strong>{issued.schoolName}</strong> lewat chat pribadi. Guru membuka <span className="font-mono">{window.location.origin}/guru</span>, masuk dengan Google, lalu menempel kode.</p>
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-mono text-2xl font-bold tracking-widest text-slate-900">{issued.code}</span>
            <CopyButton value={issued.code} />
          </div>
          <p className="text-xs text-slate-600">Berlaku sampai {formatDateTime(issued.expiresAt)}.</p>
          <Notice tone="warning">Kode hanya ditampilkan sekali. Simpan atau kirim sekarang.</Notice>
          <button type="button" onClick={() => setIssued(null)} className="btn btn-primary w-full px-4 py-2.5 text-sm">Selesai</button>
        </Modal>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
const SchoolsTab: React.FC<{ schools: SchoolRow[]; reload: () => Promise<void> }> = ({ schools, reload }) => {
  const [editing, setEditing] = useState<Partial<SchoolRow> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError('');
    try {
      await staffApi('admin/schools', { id: editing.id, name: editing.name, city: editing.city ?? '', npsn: editing.npsn ?? '' });
      setEditing(null);
      await reload();
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  };
  const rotate = async (s: SchoolRow) => {
    if (!window.confirm(`Ganti Kode Sekolah ${s.name}? Kartu login lama tidak berlaku. Siswa tetap bisa masuk dengan NIS + PIN.`)) return;
    try { await staffApi('admin/schools/rotate-code', { schoolId: s.id }); await reload(); } catch (e) { setError((e as Error).message); }
  };
  return (
    <section className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-display font-bold text-slate-900">Sekolah ({schools.length})</h2>
        <button type="button" onClick={() => setEditing({ name: '', city: '', npsn: '' })} className="btn btn-primary px-3 min-h-0 h-9 text-xs"><Plus className="w-4 h-4" aria-hidden="true" /> Tambah sekolah</button>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
        {schools.map((s) => (
          <li key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-semibold text-slate-900">{s.name}{s.is_test && <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">uji</span>}</div>
              <div className="text-xs text-slate-600 flex flex-wrap gap-x-3">
                <span>Kode Sekolah <span className="font-mono font-semibold text-slate-900">{s.school_code}</span></span>
                <span>NPSN {s.npsn ?? '-'}</span>
                <span>{s.city ?? ''}</span>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => setEditing(s)} className="btn btn-secondary px-3 min-h-0 h-8 text-xs"><Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Ubah</button>
              <button type="button" onClick={() => void rotate(s)} className="btn btn-secondary px-3 min-h-0 h-8 text-xs"><RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Ganti kode</button>
            </div>
          </li>
        ))}
      </ul>
      {editing && (
        <Modal title={editing.id ? 'Ubah sekolah' : 'Tambah sekolah'} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-3">
            <Input id="sch-name" label="Nama sekolah" value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input id="sch-city" label="Kota" value={editing.city ?? ''} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
            <Input id="sch-npsn" label="NPSN" value={editing.npsn ?? ''} inputMode="numeric" onChange={(e) => setEditing({ ...editing, npsn: e.target.value.replace(/\D/g, '').slice(0, 8) })} />
            {error && <Notice tone="error">{error}</Notice>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setEditing(null)} className="btn btn-secondary px-4 py-2 text-sm">Batal</button>
              <button type="submit" disabled={busy || (editing.name ?? '').trim().length < 3} className="btn btn-primary px-4 py-2 text-sm">Simpan</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
};

// ---------------------------------------------------------------------------
const TeachersTab: React.FC = () => {
  const [rows, setRows] = useState<TeacherRow[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setRows((await staffApi<{ teachers: TeacherRow[] }>('admin/teachers')).teachers); } catch (e) { setError((e as Error).message); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const toggle = async (t: TeacherRow) => {
    const next = t.status === 'active' ? 'disabled' : 'active';
    if (next === 'disabled' && !window.confirm(`Nonaktifkan ${t.email}? Guru ini langsung kehilangan akses ke data siswa.`)) return;
    try { await staffApi('admin/teachers/set-status', { userId: t.userId, status: next }); await load(); } catch (e) { setError((e as Error).message); }
  };
  return (
    <section className="card p-5 space-y-3">
      <h2 className="text-base font-display font-bold text-slate-900">Guru ({rows.length})</h2>
      <p className="text-xs text-slate-600">Guru bertanda "Baru" aktif dalam 3 hari terakhir. Periksa bahwa emailnya memang guru yang Anda kirimi kode.</p>
      {error && <Notice tone="error">{error}</Notice>}
      {rows.length === 0 ? <Notice>Belum ada guru.</Notice> : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
          {rows.map((t) => (
            <li key={t.userId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900 break-all">{t.email}</span>
                  {t.isNew && <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-semibold">Baru</span>}
                  {t.status === 'disabled' && <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">Nonaktif</span>}
                </div>
                <div className="text-xs text-slate-600">{t.schoolName} · aktif sejak {formatDateTime(t.createdAt)}</div>
              </div>
              <button type="button" onClick={() => void toggle(t)} className="btn btn-secondary px-3 min-h-0 h-8 text-xs">
                {t.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

// ---------------------------------------------------------------------------
type Tab = 'invites' | 'schools' | 'teachers' | 'students' | 'ops';
const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'invites', label: 'Kode Aktivasi', icon: KeyRound },
  { id: 'schools', label: 'Sekolah', icon: School },
  { id: 'teachers', label: 'Guru', icon: Users },
  { id: 'students', label: 'Bantuan Siswa', icon: LifeBuoy },
  { id: 'ops', label: 'Status Layanan', icon: Activity },
];

const AdminPanel: React.FC = () => {
  const [tab, setTab] = useState<Tab>('invites');
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [query, setQuery] = useState('');
  const loadSchools = useCallback(async () => {
    try { setSchools((await staffApi<{ schools: SchoolRow[] }>('admin/schools')).schools); } catch { /* ditampilkan di tab */ }
  }, []);
  useEffect(() => { void loadSchools(); }, [loadSchools]);

  return (
    <div className="space-y-6">
      <nav aria-label="Menu admin" className="flex gap-1 p-1 rounded-xl bg-slate-100 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}
            className={`flex-1 min-w-max inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer ${tab === id ? 'bg-white text-brand-700 border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}>
            <Icon className="w-4 h-4" aria-hidden="true" /> {label}
          </button>
        ))}
      </nav>
      {tab === 'invites' && <InvitesTab schools={schools} onChanged={() => void loadSchools()} />}
      {tab === 'schools' && <SchoolsTab schools={schools} reload={loadSchools} />}
      {tab === 'teachers' && <TeachersTab />}
      {tab === 'ops' && <OpsTab />}
      {tab === 'students' && (
        <section className="card p-5 space-y-4">
          <Input id="admin-search" label="Cari siswa di semua sekolah berdasarkan NIS" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Minimal 3 karakter" className="font-mono" />
          <StudentManager key={`q-${query}`} nisQuery={query} showSchool />
        </section>
      )}
    </div>
  );
};

export default function AdminApp() {
  const { status, me, error, signOut } = useStaffAuth();
  let body: React.ReactNode;
  if (!staffConfigured) body = <Notice tone="error">Server belum dikonfigurasi (variabel VITE_SUPABASE_* kosong).</Notice>;
  else if (status === 'loading' || (status === 'signedIn' && !me && !error)) body = <p role="status" className="text-sm text-slate-600">Memeriksa sesi...</p>;
  else if (status === 'signedOut') body = <SignIn error={error} />;
  else if (me?.profile?.role === 'admin' && me.profile.status === 'active') body = <AdminPanel />;
  else body = <Notice tone="error">Akun ini bukan admin. <button type="button" onClick={() => void signOut()} className="font-semibold underline cursor-pointer">Keluar</button></Notice>;

  return (
    <StaffShell title="Panel Admin" subtitle="E-Modul Induksi Elektromagnetik" email={me?.email}
      onSignOut={status === 'signedIn' ? () => void signOut() : undefined}>
      {body}
    </StaffShell>
  );
}
