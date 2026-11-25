// Daftar siswa + tindakan guru/admin: buka kunci, reset PIN, ubah nama/NIS, pindah, nonaktifkan, hapus.
// Data dibaca langsung lewat RLS (guru hanya melihat sekolahnya); tindakan lewat /api/teacher/*.

import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound, Loader2, Lock, Pencil, RefreshCw, Shuffle, Trash2, UserCheck, UserX } from 'lucide-react';
import { staffApi, staffClient } from './staffClient';
import { Modal, Notice, formatDateTime } from './StaffShell';

interface Row {
  id: string;
  nis: string;
  student_name: string;
  status: 'active' | 'disabled';
  locked_until: string | null;
  must_change_pin: boolean;
  last_login_at: string | null;
  school_id: string;
  class_id: string | null;
  groups: { name: string } | null;
  classes: { name: string } | null;
  schools?: { name: string } | null;
  student_state: { completion_percent: number; current_screen: number } | null;
}

type Dialog =
  | { kind: 'pin'; row: Row; pin: string; reason: string }
  | { kind: 'edit'; row: Row }
  | { kind: 'move'; row: Row }
  | { kind: 'delete'; row: Row }
  | null;

const SELECT =
  'id, nis, student_name, status, locked_until, must_change_pin, last_login_at, school_id, class_id, groups(name), classes(name), student_state(completion_percent, current_screen)';

export const StudentManager: React.FC<{ classId?: string; nisQuery?: string; showSchool?: boolean }> = ({ classId, nisQuery, showSchool }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);

  const load = useCallback(async () => {
    if (!staffClient) return;
    setLoading(true);
    setError('');
    let q = staffClient.from('students').select(showSchool ? `${SELECT}, schools(name)` : SELECT).order('student_name').limit(500);
    if (classId) q = q.eq('class_id', classId);
    if (nisQuery !== undefined) {
      const term = nisQuery.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (term.length < 3) {
        setRows([]);
        setLoading(false);
        return;
      }
      q = q.ilike('nis', `%${term}%`);
    }
    const { data, error: err } = await q;
    if (err) setError('Gagal memuat daftar siswa. Coba muat ulang.');
    else setRows((data ?? []) as unknown as Row[]);
    setLoading(false);
  }, [classId, nisQuery, showSchool]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (row: Row, fn: () => Promise<void>) => {
    setBusyId(row.id);
    setError('');
    setInfo('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const unlock = (row: Row) => act(row, async () => {
    await staffApi('teacher/unlock', { studentId: row.id });
    setInfo(`Akun ${row.student_name} dibuka.`);
  });

  const resetPin = (row: Row) => {
    if (!window.confirm(`Reset PIN ${row.student_name}? PIN lama tidak berlaku lagi.`)) return;
    void act(row, async () => {
      const { tempPin } = await staffApi<{ tempPin: string }>('teacher/reset-pin', { studentId: row.id });
      setDialog({ kind: 'pin', row, pin: tempPin, reason: 'PIN direset.' });
    });
  };

  const toggleStatus = (row: Row) => {
    const next = row.status === 'active' ? 'disabled' : 'active';
    if (next === 'disabled' && !window.confirm(`Nonaktifkan ${row.student_name}? Siswa tidak bisa masuk sampai diaktifkan lagi.`)) return;
    void act(row, async () => {
      await staffApi('teacher/set-student-status', { studentId: row.id, status: next });
      setInfo(next === 'disabled' ? `${row.student_name} dinonaktifkan.` : `${row.student_name} diaktifkan lagi.`);
    });
  };

  const statusOf = (row: Row) => {
    if (row.status === 'disabled') return { text: 'Nonaktif', cls: 'bg-slate-100 text-slate-700' };
    if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
      return { text: `Terkunci s.d. ${new Date(row.locked_until).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`, cls: 'bg-rose-50 text-rose-700' };
    }
    if (row.must_change_pin) return { text: 'Menunggu PIN baru', cls: 'bg-amber-50 text-amber-800' };
    return { text: 'Aktif', cls: 'bg-emerald-50 text-emerald-800' };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-600">{loading ? 'Memuat...' : `${rows.length} siswa`}</p>
        <button type="button" onClick={() => void load()} className="btn btn-secondary px-3 min-h-0 h-8 text-xs">
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Muat ulang
        </button>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      {info && <Notice tone="success">{info}</Notice>}

      {!loading && rows.length === 0 ? (
        <Notice>{nisQuery !== undefined ? 'Ketik minimal 3 karakter NIS untuk mencari.' : 'Belum ada siswa. Bagikan kode kelas agar siswa bisa mendaftar.'}</Notice>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
          {rows.map((row) => {
            const st = statusOf(row);
            const locked = st.text.startsWith('Terkunci');
            const busy = busyId === row.id;
            return (
              <li key={row.id} className="p-4 flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{row.student_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${st.cls}`}>{st.text}</span>
                  </div>
                  <div className="text-xs text-slate-600 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>NIS <span className="font-mono font-semibold text-slate-800">{row.nis}</span></span>
                    {showSchool && <span>{row.schools?.name}</span>}
                    {(showSchool || !classId) && <span>{row.classes?.name ?? '-'}</span>}
                    <span>{row.groups?.name ?? 'Tanpa kelompok'}</span>
                    <span>Progres {row.student_state?.completion_percent ?? 0}%</span>
                    <span>Masuk terakhir {formatDateTime(row.last_login_at)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {busy && <Loader2 className="w-4 h-4 animate-spin self-center text-slate-500" aria-label="Memproses" />}
                  {locked && (
                    <button type="button" disabled={busy} onClick={() => void unlock(row)} className="btn btn-primary px-3 min-h-0 h-8 text-xs">
                      <Lock className="w-3.5 h-3.5" aria-hidden="true" /> Buka kunci
                    </button>
                  )}
                  <button type="button" disabled={busy} onClick={() => resetPin(row)} className="btn btn-secondary px-3 min-h-0 h-8 text-xs">
                    <KeyRound className="w-3.5 h-3.5" aria-hidden="true" /> Reset PIN
                  </button>
                  <button type="button" disabled={busy} onClick={() => setDialog({ kind: 'edit', row })} className="btn btn-secondary px-3 min-h-0 h-8 text-xs">
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Ubah
                  </button>
                  <button type="button" disabled={busy} onClick={() => setDialog({ kind: 'move', row })} className="btn btn-secondary px-3 min-h-0 h-8 text-xs">
                    <Shuffle className="w-3.5 h-3.5" aria-hidden="true" /> Pindah
                  </button>
                  <button type="button" disabled={busy} onClick={() => toggleStatus(row)} className="btn btn-secondary px-3 min-h-0 h-8 text-xs">
                    {row.status === 'active'
                      ? <><UserX className="w-3.5 h-3.5" aria-hidden="true" /> Nonaktifkan</>
                      : <><UserCheck className="w-3.5 h-3.5" aria-hidden="true" /> Aktifkan</>}
                  </button>
                  <button type="button" disabled={busy} onClick={() => setDialog({ kind: 'delete', row })}
                    className="btn btn-secondary px-3 min-h-0 h-8 text-xs hover:text-rose-700 hover:border-rose-300" aria-label={`Hapus ${row.student_name}`}>
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {dialog?.kind === 'pin' && (
        <Modal title="PIN Sementara" onClose={() => setDialog(null)}>
          <p className="text-sm text-slate-700">{dialog.reason} Berikan PIN ini kepada <strong>{dialog.row.student_name}</strong>. Siswa wajib membuat PIN baru saat masuk.</p>
          <div className="text-center py-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-3xl font-bold tracking-[0.3em] text-slate-900">{dialog.pin}</div>
          <Notice tone="warning">PIN ini hanya ditampilkan sekali. Catat sebelum menutup.</Notice>
          <button type="button" onClick={() => setDialog(null)} className="btn btn-primary w-full px-4 py-2.5 text-sm">Sudah dicatat</button>
        </Modal>
      )}
      {dialog?.kind === 'edit' && (
        <EditDialog row={dialog.row} onClose={() => setDialog(null)}
          onDone={async (tempPin) => {
            await load();
            if (tempPin) setDialog({ kind: 'pin', row: dialog.row, pin: tempPin, reason: 'NIS diubah, sehingga PIN ikut direset.' });
            else { setDialog(null); setInfo('Data siswa diperbarui.'); }
          }} />
      )}
      {dialog?.kind === 'move' && (
        <MoveDialog row={dialog.row} onClose={() => setDialog(null)} onDone={async () => { setDialog(null); setInfo(`${dialog.row.student_name} dipindahkan.`); await load(); }} />
      )}
      {dialog?.kind === 'delete' && (
        <DeleteDialog row={dialog.row} onClose={() => setDialog(null)} onDone={async () => { setDialog(null); setInfo('Akun siswa dihapus.'); await load(); }} />
      )}
    </div>
  );
};

const FieldInput: React.FC<{ id: string; label: string; value: string; onChange: (v: string) => void; mono?: boolean; hint?: string }> = (p) => (
  <label htmlFor={p.id} className="block space-y-1">
    <span className="text-xs font-bold text-slate-700">{p.label}</span>
    <input id={p.id} value={p.value} onChange={(e) => p.onChange(e.target.value)}
      className={`input w-full px-3 py-2 text-sm ${p.mono ? 'font-mono' : ''}`} />
    {p.hint && <span className="block text-[11px] text-slate-500">{p.hint}</span>}
  </label>
);

const EditDialog: React.FC<{ row: Row; onClose: () => void; onDone: (tempPin: string | null) => Promise<void> }> = ({ row, onClose, onDone }) => {
  const [name, setName] = useState(row.student_name);
  const [nis, setNis] = useState(row.nis);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const patch: Record<string, string> = { studentId: row.id };
      if (name.trim() !== row.student_name) patch.name = name;
      if (nis.replace(/\s+/g, '').toUpperCase() !== row.nis) patch.nis = nis;
      const res = await staffApi<{ tempPin: string | null }>('teacher/update-student', patch);
      await onDone(res.tempPin);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };
  return (
    <Modal title={`Ubah data ${row.student_name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <FieldInput id="edit-name" label="Nama" value={name} onChange={setName} />
        <FieldInput id="edit-nis" label="NIS" value={nis} onChange={setNis} mono hint="Mengubah NIS akan mereset PIN siswa." />
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-secondary px-4 py-2 text-sm">Batal</button>
          <button type="submit" disabled={busy} className="btn btn-primary px-4 py-2 text-sm">{busy && <Loader2 className="w-4 h-4 animate-spin" />}Simpan</button>
        </div>
      </form>
    </Modal>
  );
};

const MoveDialog: React.FC<{ row: Row; onClose: () => void; onDone: () => Promise<void> }> = ({ row, onClose, onDone }) => {
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [classId, setClassId] = useState(row.class_id ?? '');
  const [groupName, setGroupName] = useState(row.groups?.name ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    staffClient?.from('classes').select('id, name').eq('school_id', row.school_id).eq('archived', false).order('name')
      .then(({ data }) => setClasses(data ?? []));
  }, [row.school_id]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await staffApi('teacher/move-student', { studentId: row.id, classId, groupName });
      await onDone();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };
  return (
    <Modal title={`Pindahkan ${row.student_name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <label htmlFor="move-class" className="block space-y-1">
          <span className="text-xs font-bold text-slate-700">Kelas tujuan</span>
          <select id="move-class" value={classId} onChange={(e) => setClassId(e.target.value)} className="input w-full px-3 py-2 text-sm">
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <FieldInput id="move-group" label="Kelompok tujuan" value={groupName} onChange={setGroupName}
          hint="Tulis nama kelompok yang sudah ada, atau nama baru untuk membuat kelompok." />
        <p className="text-[11px] text-slate-500">Jawaban pribadi siswa ikut pindah. Isian kelompok lama tetap di kelompok lama.</p>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-secondary px-4 py-2 text-sm">Batal</button>
          <button type="submit" disabled={busy || !classId || !groupName.trim()} className="btn btn-primary px-4 py-2 text-sm">{busy && <Loader2 className="w-4 h-4 animate-spin" />}Pindahkan</button>
        </div>
      </form>
    </Modal>
  );
};

const DeleteDialog: React.FC<{ row: Row; onClose: () => void; onDone: () => Promise<void> }> = ({ row, onClose, onDone }) => {
  const [confirmNis, setConfirmNis] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await staffApi('teacher/delete-student', { studentId: row.id, confirmNis: confirmNis.replace(/\s+/g, '').toUpperCase() });
      await onDone();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };
  return (
    <Modal title="Hapus akun siswa" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Notice tone="warning">Akun <strong>{row.student_name}</strong> beserta semua jawabannya akan dihapus permanen. Gunakan ini untuk pendaftar palsu atau salah daftar.</Notice>
        <FieldInput id="delete-nis" label={`Ketik NIS (${row.nis}) untuk konfirmasi`} value={confirmNis} onChange={setConfirmNis} mono />
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-secondary px-4 py-2 text-sm">Batal</button>
          <button type="submit" disabled={busy || confirmNis.replace(/\s+/g, '').toUpperCase() !== row.nis}
            className="btn px-4 py-2 text-sm bg-rose-600 hover:bg-rose-700 text-white border-rose-600">{busy && <Loader2 className="w-4 h-4 animate-spin" />}Hapus permanen</button>
        </div>
      </form>
    </Modal>
  );
};
