// Fase 6: endpoint operasional.
//   GET /api/ping         (Vercel Cron harian)   : query kecil ke Supabase agar project Free tidak di-pause.
//   GET /api/maintenance  (Vercel Cron mingguan) : hapus log lama, batas laju kedaluwarsa, berkas yatim.
//   GET /api/admin/ops    (admin)                : riwayat cron dan pemakaian kuota.
// Endpoint cron hanya menerima header Authorization: Bearer $CRON_SECRET (dikirim otomatis oleh Vercel).
import { createHash, timingSafeEqual } from 'node:crypto';
import { admin } from './supabase.js';
import { env, optionalEnv } from './env.js';
import { HttpError, json } from './http.js';
import { requireAdmin } from './staff.js';

const BUCKET = 'emodul-uploads';
const FILE_REF_KEYS = ['designSketchFile', 'processPhotoFile', 'prototypePhotoFile', 'labReportFile'];
const DAY = 24 * 60 * 60 * 1000;

function requireCron(request) {
  const secret = env('CRON_SECRET');
  const got = request.headers.get('authorization') ?? '';
  const a = createHash('sha256').update(got).digest();
  const b = createHash('sha256').update(`Bearer ${secret}`).digest();
  if (!timingSafeEqual(a, b)) throw new HttpError(401, 'unauthorized', 'Tidak diizinkan.');
}

async function record(job, ok, detail, startedAt) {
  const { error } = await admin().from('ops_runs').insert({ job, ok, detail, duration_ms: Date.now() - startedAt });
  if (error) console.error(`Catatan ${job} gagal disimpan:`, error.message);
}

// ---------------------------------------------------------------------------
async function ping(request) {
  requireCron(request);
  const started = Date.now();
  const { data, error } = await admin().rpc('ping');
  await record('ping', !error, error ? { error: error.message } : { db_time: data }, started);
  if (error) throw new HttpError(503, 'db_unavailable', 'Database tidak merespons.');
  return json(200, { ok: true, dbTime: data });
}

// ---------------------------------------------------------------------------
/** Berkas di tabel files yang tidak lagi dirujuk group_state (diganti/dihapus saat jaringan putus, edit bersamaan). */
async function cleanupUnreferencedFiles(db, cutoffIso, limit) {
  const { data: rows, error } = await db.from('files').select('id, group_id, storage_path').lt('created_at', cutoffIso).order('created_at').limit(limit);
  if (error) throw error;
  if (!rows.length) return { checked: 0, removed: 0 };
  const groupIds = [...new Set(rows.map((r) => r.group_id))];
  const referenced = new Set();
  for (let i = 0; i < groupIds.length; i += 100) {
    const { data: gs, error: gErr } = await db.from('group_state').select('data').in('group_id', groupIds.slice(i, i + 100));
    if (gErr) throw gErr;
    for (const g of gs ?? []) for (const k of FILE_REF_KEYS) if (g.data?.[k]?.path) referenced.add(g.data[k].path);
  }
  const orphans = rows.filter((r) => !referenced.has(r.storage_path));
  for (let i = 0; i < orphans.length; i += 100) {
    const batch = orphans.slice(i, i + 100);
    const { error: rmErr } = await db.storage.from(BUCKET).remove(batch.map((r) => r.storage_path));
    if (rmErr) throw rmErr;
    const { error: delErr } = await db.from('files').delete().in('id', batch.map((r) => r.id));
    if (delErr) throw delErr;
  }
  return { checked: rows.length, removed: orphans.length };
}

/** Objek Storage tanpa baris files (unggah berhasil tetapi pencatatan gagal). */
async function cleanupUntrackedObjects(db, limit) {
  const { data, error } = await db.rpc('ops_untracked_objects', { p_min_age: '1 day', p_limit: limit });
  if (error) throw error;
  const names = (data ?? []).map((r) => r.name);
  for (let i = 0; i < names.length; i += 100) {
    const { error: rmErr } = await db.storage.from(BUCKET).remove(names.slice(i, i + 100));
    if (rmErr) throw rmErr;
  }
  return { removed: names.length };
}

async function deleteOlder(db, table, column, cutoffIso) {
  const { count, error } = await db.from(table).delete({ count: 'exact' }).lt(column, cutoffIso);
  if (error) throw error;
  return count ?? 0;
}

export async function runMaintenance(now = Date.now()) {
  const db = admin();
  const auditDays = Number(optionalEnv('AUDIT_RETENTION_DAYS', '90')) || 90;
  const steps = {
    auth_events: () => deleteOlder(db, 'auth_events', 'created_at', new Date(now - auditDays * DAY).toISOString()),
    rate_limits: () => deleteOlder(db, 'rate_limits', 'window_start', new Date(now - 2 * DAY).toISOString()),
    ops_runs: () => deleteOlder(db, 'ops_runs', 'ran_at', new Date(now - 180 * DAY).toISOString()),
    unreferenced_files: () => cleanupUnreferencedFiles(db, new Date(now - DAY).toISOString(), 500),
    untracked_objects: () => cleanupUntrackedObjects(db, 500),
  };
  const detail = {};
  let ok = true;
  for (const [name, fn] of Object.entries(steps)) {
    try {
      detail[name] = await fn();
    } catch (e) {
      ok = false;
      detail[name] = { error: String(e?.message ?? e).slice(0, 200) };
    }
  }
  return { ok, detail };
}

async function maintenance(request) {
  requireCron(request);
  const started = Date.now();
  const { ok, detail } = await runMaintenance();
  await record('maintenance', ok, detail, started);
  return json(ok ? 200 : 500, { ok, detail });
}

// ---------------------------------------------------------------------------
async function opsStatus(request) {
  await requireAdmin(request);
  const db = admin();
  const [runs, usage] = await Promise.all([
    db.from('ops_runs').select('job, ok, detail, duration_ms, ran_at').order('ran_at', { ascending: false }).limit(40),
    db.rpc('ops_usage'),
  ]);
  if (runs.error) throw runs.error;
  if (usage.error) throw usage.error;
  const last = (job) => runs.data.find((r) => r.job === job) ?? null;
  const lastOk = (job) => runs.data.find((r) => r.job === job && r.ok) ?? null;
  return json(200, {
    lastPing: last('ping'), lastOkPing: lastOk('ping'),
    lastMaintenance: last('maintenance'), lastOkMaintenance: lastOk('maintenance'),
    runs: runs.data, usage: usage.data,
    limits: { db_bytes: 500 * 1024 * 1024, storage_bytes: 1024 * 1024 * 1024 },
  });
}

export const opsRoutes = {
  ping: { GET: ping },
  maintenance: { GET: maintenance },
  'admin/ops': { GET: opsStatus },
};
