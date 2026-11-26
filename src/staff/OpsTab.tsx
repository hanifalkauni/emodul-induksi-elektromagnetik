// Fase 6: status operasional untuk admin (cron anti-pause, pemeliharaan, pemakaian kuota Free).
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { staffApi } from './staffClient';
import { Notice, formatDateTime } from './StaffShell';

interface Run { job: 'ping' | 'maintenance'; ok: boolean; detail: Record<string, unknown>; duration_ms: number; ran_at: string }
interface OpsStatus {
  lastPing: Run | null; lastOkPing: Run | null; lastMaintenance: Run | null; lastOkMaintenance: Run | null;
  runs: Run[];
  usage: { db_bytes: number; storage_bytes: number; storage_objects: number; schools: number; students: number; auth_events: number };
  limits: { db_bytes: number; storage_bytes: number };
}

const HOUR = 3_600_000;
/** Batas wajar sebelum diberi peringatan: ping harian (+ kelonggaran), pemeliharaan mingguan. */
export const STALE = { ping: 36 * HOUR, maintenance: 8 * 24 * HOUR };
const mb = (b: number) => (b >= 1024 * 1024 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

const Usage: React.FC<{ label: string; used: number; limit: number }> = ({ label, used, limit }) => {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs"><span className="font-semibold text-slate-700">{label}</span><span className="font-mono text-slate-700">{mb(used)} dari {mb(limit)} ({pct}%)</span></div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full ${pct >= 80 ? 'bg-rose-600' : pct >= 60 ? 'bg-amber-500' : 'bg-brand-600'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export const OpsTab: React.FC = () => {
  const [s, setS] = useState<OpsStatus | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      setS(await staffApi<OpsStatus>('admin/ops'));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const job = (name: 'ping' | 'maintenance', last: Run | null, lastOk: Run | null, label: string) => {
    const age = lastOk ? Date.now() - Date.parse(lastOk.ran_at) : Infinity;
    const stale = age > STALE[name];
    return (
      <div className="p-4 rounded-xl border border-slate-200 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display font-bold text-slate-900">{label}</h3>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${stale ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'}`}>{stale ? 'Perlu dicek' : 'Normal'}</span>
        </div>
        <p className="text-xs text-slate-600">Terakhir berhasil: <strong className="text-slate-900">{lastOk ? formatDateTime(lastOk.ran_at) : 'belum pernah'}</strong></p>
        {last && !last.ok && <p className="text-xs text-rose-700">Percobaan terakhir gagal ({formatDateTime(last.ran_at)}).</p>}
      </div>
    );
  };

  return (
    <section className="card p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-display font-bold text-slate-900">Status layanan</h2>
        <button type="button" onClick={() => void load()} className="btn btn-secondary px-3 min-h-0 h-8 text-xs"><RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Muat ulang</button>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      {!s ? (!error && <p role="status" className="text-sm text-slate-600">Memuat...</p>) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {job('ping', s.lastPing, s.lastOkPing, 'Ping harian (anti-pause)')}
            {job('maintenance', s.lastMaintenance, s.lastOkMaintenance, 'Pemeliharaan mingguan')}
          </div>
          {(!s.lastOkPing || Date.now() - Date.parse(s.lastOkPing.ran_at) > STALE.ping) && (
            <Notice tone="warning">Ping belum berjalan dalam 36 jam terakhir. Project Supabase Free di-pause setelah sekitar 7 hari tanpa aktivitas. Periksa tab Cron Jobs di Vercel (lihat docs/RUNBOOK.md).</Notice>
          )}
          <div className="space-y-3">
            <Usage label="Database" used={s.usage.db_bytes} limit={s.limits.db_bytes} />
            <Usage label="Storage (foto dan berkas)" used={s.usage.storage_bytes} limit={s.limits.storage_bytes} />
            <p className="text-xs text-slate-600">{s.usage.schools} sekolah, {s.usage.students} siswa (tanpa data uji), {s.usage.storage_objects} berkas, {s.usage.auth_events} catatan audit.</p>
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer font-semibold text-slate-700">Riwayat {s.runs.length} jalannya cron terakhir</summary>
            <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200">
              {s.runs.map((r, i) => (
                <li key={i} className="px-3 py-1.5 flex flex-wrap gap-x-3">
                  <span className={r.ok ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>{r.ok ? 'OK' : 'GAGAL'}</span>
                  <span>{r.job}</span><span>{formatDateTime(r.ran_at)}</span><span>{r.duration_ms} ms</span>
                  {r.job === 'maintenance' && <span className="font-mono text-slate-600 break-all">{JSON.stringify(r.detail)}</span>}
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </section>
  );
};
