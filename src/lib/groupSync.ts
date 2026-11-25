// Fase 3: data kelompok bersama (spec 4.2, 4.3, 6.1).
//
// Isian teks kelompok disimpan per KUNCI di group_state.data (isi presentasi dipecah per poin), sehingga
// dua anggota yang mengedit kolom berbeda tidak saling menimpa. Peran, baris uji, dan ide disimpan per BARIS.
//
// Aturan: "snapshot" = nilai terakhir yang diketahui ada di server. Perubahan lokal = beda antara state dan
// snapshot. Saat data server baru masuk, kunci/baris tanpa perubahan lokal mengikuti server; yang punya
// perubahan lokal tetap lokal, kecuali server mengubahnya LEBIH BARU dari perubahan lokal itu (D11).

import type { EModulState, IdeaNote, RoleAssignment, TestingRow } from '../types/emodul';

/** Kunci teks kelompok (selain presentationPoints yang dipecah per poin). */
export const GROUP_SCALAR_KEYS = [
  'checkedTools', 'experimentStrategy', 'labReportLink', 'labReportFileName', 'checkedConstraints',
  'finalSelectedIdea', 'driveSyncRecorded', 'designName', 'designPhysicsPrinciple', 'designMaterials',
  'designAdvantages', 'designPrediction', 'testVideoLink', 'lmsUploadLink', 'designSuccessStatus',
  'failureCauseAnalysis', 'improveWeakness', 'improveWhatToFix', 'improveNewIdeas', 'improvePlannedChanges',
  'improveV2Voltage', 'improveV2LedStatus', 'improveDriveLink', 'presentationSlideLink',
] as const satisfies readonly (keyof EModulState)[];

const POINT_PREFIX = 'presentationPoints.';

/** Semua field state yang menjadi milik kelompok (tidak disimpan di student_state). */
export const GROUP_STATE_KEYS = new Set<keyof EModulState>([
  ...GROUP_SCALAR_KEYS, 'presentationPoints', 'roles', 'testingRows', 'ideas',
]);

export type Flat = Record<string, unknown>;

export function flattenGroup(state: EModulState): Flat {
  const out: Flat = {};
  for (const k of GROUP_SCALAR_KEYS) out[k] = state[k];
  for (const [k, v] of Object.entries(state.presentationPoints)) out[POINT_PREFIX + k] = v;
  return out;
}

export function applyFlat(state: EModulState, flat: Flat): EModulState {
  const next = { ...state } as Record<string, unknown>;
  const points = { ...state.presentationPoints } as Record<string, string>;
  for (const [k, v] of Object.entries(flat)) {
    if (k.startsWith(POINT_PREFIX)) {
      const p = k.slice(POINT_PREFIX.length);
      if (p in points) points[p] = typeof v === 'string' ? v : '';
    } else if ((GROUP_SCALAR_KEYS as readonly string[]).includes(k)) {
      next[k] = v;
    }
  }
  next.presentationPoints = points;
  return next as unknown as EModulState;
}

export const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
export const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

// ---------------------------------------------------------------------------
// Bentuk baris server
// ---------------------------------------------------------------------------
export interface ServerRole { role: string; member_name: string; task_description: string; updated_at: string }
export interface ServerTrial {
  id: string; sort_order: number; trial_label: string; voltage: string; turns: string; speed: string;
  magnet_condition: string; led_lit: 'Ya' | 'Tidak'; updated_at: string;
}
export interface ServerIdea {
  id: string; author_id: string | null; author_name: string; title: string; drive_mechanism: IdeaNote['driveMechanism'];
  description: string; color: IdeaNote['color']; created_at: string; idea_votes: { voter_id: string }[];
}
export interface ServerBundle {
  data: Flat;
  dataMeta: Record<string, string>;
  roles: ServerRole[];
  trials: ServerTrial[];
  ideas: ServerIdea[];
}

export const roleFromServer = (r: ServerRole): RoleAssignment => ({
  role: r.role as RoleAssignment['role'], memberName: r.member_name, taskDescription: r.task_description,
});
export const trialFromServer = (t: ServerTrial): TestingRow => ({
  id: t.id, trialLabel: t.trial_label, voltage: t.voltage, turns: t.turns, speed: t.speed,
  magnetCondition: t.magnet_condition, ledLit: t.led_lit,
});
export function ideaFromServer(i: ServerIdea, me: string | null): IdeaNote {
  return {
    id: i.id, authorId: i.author_id, authorName: i.author_name, title: i.title, driveMechanism: i.drive_mechanism,
    description: i.description, color: i.color, createdAt: i.created_at,
    votes: i.idea_votes?.length ?? 0, votedByMe: Boolean(me && i.idea_votes?.some((v) => v.voter_id === me)),
  };
}

const clip = (v: unknown, max: number) => String(v ?? '').slice(0, max);
export function trialToRow(t: TestingRow, sortOrder: number) {
  return {
    sort_order: sortOrder, trial_label: clip(t.trialLabel, 60), voltage: clip(t.voltage, 30), turns: clip(t.turns, 30),
    speed: clip(t.speed, 30), magnet_condition: clip(t.magnetCondition, 100), led_lit: t.ledLit === 'Ya' ? 'Ya' : 'Tidak',
  };
}
export function ideaToRow(i: IdeaNote, groupId: string, me: string) {
  return {
    id: i.id, group_id: groupId, author_id: me,
    author_name: clip(i.authorName, 100).trim() || 'Anggota Tim',
    title: clip(i.title, 120).trim() || 'Tanpa judul',
    drive_mechanism: i.driveMechanism, description: clip(i.description, 1000).trim() || '-', color: i.color,
  };
}

// ---------------------------------------------------------------------------
// Snapshot server dan perubahan lokal
// ---------------------------------------------------------------------------
export interface Snapshot {
  flat: Flat;
  roles: Record<string, { memberName: string; taskDescription: string }>;
  trials: Record<string, { row: TestingRow; sortOrder: number }>;
  ideaIds: string[];
}

export function snapshotFrom(b: ServerBundle): Snapshot {
  return {
    flat: { ...b.data },
    roles: Object.fromEntries(b.roles.map((r) => [r.role, { memberName: r.member_name, taskDescription: r.task_description }])),
    trials: Object.fromEntries(b.trials.map((t) => [t.id, { row: trialFromServer(t), sortOrder: t.sort_order }])),
    ideaIds: b.ideas.map((i) => i.id),
  };
}

export interface LocalChanges {
  keys: string[];
  roles: string[];
  trialInserts: { row: TestingRow; sortOrder: number }[];
  trialUpdates: { row: TestingRow; sortOrder: number }[];
  trialDeletes: string[];
  ideaInserts: IdeaNote[];
  ideaDeletes: string[];
}

export function diffLocal(state: EModulState, snap: Snapshot): LocalChanges {
  const flat = flattenGroup(state);
  const keys = Object.keys(flat).filter((k) => !same(flat[k], snap.flat[k] ?? undefined) && !(snap.flat[k] === undefined && isDefaultLike(flat[k])));
  const roles = state.roles
    .filter((r) => {
      const s = snap.roles[r.role];
      return s && (s.memberName !== r.memberName || s.taskDescription !== r.taskDescription);
    })
    .map((r) => r.role);
  const trialInserts: LocalChanges['trialInserts'] = [];
  const trialUpdates: LocalChanges['trialUpdates'] = [];
  state.testingRows.forEach((row, i) => {
    const s = snap.trials[row.id];
    if (!s) trialInserts.push({ row, sortOrder: i });
    else if (!same(s.row, row) || s.sortOrder !== i) trialUpdates.push({ row, sortOrder: i });
  });
  const localTrialIds = new Set(state.testingRows.map((r) => r.id));
  const trialDeletes = Object.keys(snap.trials).filter((id) => !localTrialIds.has(id));
  const snapIdeas = new Set(snap.ideaIds);
  const localIdeaIds = new Set(state.ideas.map((i) => i.id));
  return {
    keys, roles, trialInserts, trialUpdates, trialDeletes,
    ideaInserts: state.ideas.filter((i) => !snapIdeas.has(i.id)),
    ideaDeletes: snap.ideaIds.filter((id) => !localIdeaIds.has(id)),
  };
}

/** Nilai kosong ('' / [] / false / null) yang belum pernah dikirim tidak dianggap perubahan. */
function isDefaultLike(v: unknown): boolean {
  return v === '' || v === false || v === null || v === undefined || (Array.isArray(v) && v.length === 0);
}

export const hasChanges = (c: LocalChanges) =>
  c.keys.length + c.roles.length + c.trialInserts.length + c.trialUpdates.length + c.trialDeletes.length +
  c.ideaInserts.length + c.ideaDeletes.length > 0;

/** Penanda waktu perubahan lokal per item, dipakai saat konflik dengan perubahan teman (D11). */
export type ChangeTimes = Record<string, string>;
export const timeKey = {
  key: (k: string) => `k:${k}`,
  role: (r: string) => `r:${r}`,
  trial: (id: string) => `t:${id}`,
};

// ---------------------------------------------------------------------------
// Gabungkan data server ke state lokal
// ---------------------------------------------------------------------------
export function mergeServer(params: {
  state: EModulState;
  bundle: ServerBundle;
  snap: Snapshot | null; // null = pertama kali di perangkat ini untuk kelompok ini
  times: ChangeTimes;
  me: string | null;
  /** Diisi dengan nilai lokal yang tertunda tetapi kalah dari perubahan teman (untuk cadangan 7 hari). */
  lost?: Record<string, unknown>;
}): EModulState {
  const { state, bundle, snap, times, me } = params;
  const lose = (k: string, v: unknown) => { if (params.lost) params.lost[k] = v; };
  const local = snap ? diffLocal(state, snap) : null;
  /**
   * Perubahan lokal yang tertunda hanya kalah bila TEMAN mengubah item yang sama di server (nilai server
   * berbeda dari snapshot terakhir kita) DAN perubahan itu lebih baru. Gema dari kiriman kita sendiri
   * tidak pernah menimpa ketikan terbaru, sehingga jam perangkat yang salah tidak berbahaya di kasus biasa.
   */
  const serverWins = (teammateChanged: boolean, serverIso: string | undefined, tk: string) =>
    teammateChanged && Boolean(serverIso && times[tk] && new Date(serverIso).getTime() > new Date(times[tk]).getTime());

  // Kunci teks
  const flat = flattenGroup(state);
  const nextFlat: Flat = {};
  for (const k of Object.keys(flat)) {
    const serverHas = Object.prototype.hasOwnProperty.call(bundle.data, k);
    const pending = snap ? local!.keys.includes(k) : !serverHas && !isDefaultLike(flat[k]);
    const teammateChanged = Boolean(snap) && serverHas && !same(bundle.data[k], snap!.flat[k]);
    const wins = pending && serverWins(teammateChanged, bundle.dataMeta[k], timeKey.key(k));
    if (wins) lose(timeKey.key(k), flat[k]);
    if (pending && !wins) nextFlat[k] = flat[k];
    else if (serverHas) nextFlat[k] = bundle.data[k];
    else nextFlat[k] = flat[k];
  }
  let next = applyFlat(state, nextFlat);

  // Peran
  const roleRows = new Map(bundle.roles.map((r) => [r.role, r]));
  next = {
    ...next,
    roles: state.roles.map((r) => {
      const s = roleRows.get(r.role);
      if (!s) return r;
      const pending = snap ? local!.roles.includes(r.role) : !s.member_name && Boolean(r.memberName.trim());
      const prevSnap = snap?.roles[r.role];
      const teammateChanged = Boolean(prevSnap) && (prevSnap!.memberName !== s.member_name || prevSnap!.taskDescription !== s.task_description);
      const wins = pending && serverWins(teammateChanged, s.updated_at, timeKey.role(r.role));
      if (wins) lose(timeKey.role(r.role), r);
      return pending && !wins ? r : roleFromServer(s);
    }),
  };

  // Baris uji
  const serverTrials = new Map(bundle.trials.map((t) => [t.id, t]));
  const localById = new Map(state.testingRows.map((r) => [r.id, r]));
  const rows: { row: TestingRow; order: number }[] = [];
  for (const t of bundle.trials) {
    const prevSnap = snap?.trials[t.id];
    const teammateChanged = Boolean(prevSnap) && !same(prevSnap!.row, trialFromServer(t));
    const trialWins = serverWins(teammateChanged, t.updated_at, timeKey.trial(t.id));
    if (snap && local!.trialDeletes.includes(t.id)) {
      if (!trialWins) continue; // hapus lokal tertunda
      lose(timeKey.trial(t.id), 'dihapus');
    }
    const mine = localById.get(t.id);
    const pending = snap && mine && local!.trialUpdates.some((u) => u.row.id === t.id);
    if (pending && trialWins) lose(timeKey.trial(t.id), mine);
    rows.push({ row: pending && !trialWins ? mine! : trialFromServer(t), order: t.sort_order });
  }
  state.testingRows.forEach((r, i) => {
    if (serverTrials.has(r.id)) return;
    const isNew = snap ? local!.trialInserts.some((x) => x.row.id === r.id) : !isPristineTrial(r);
    if (isNew) rows.push({ row: isUuid(r.id) ? r : { ...r, id: crypto.randomUUID() }, order: i + 0.5 });
  });
  rows.sort((a, b) => a.order - b.order);
  next = { ...next, testingRows: rows.map((x) => x.row) };

  // Ide
  const serverIdeaIds = new Set(bundle.ideas.map((i) => i.id));
  const pendingDeletes = new Set(snap ? local!.ideaDeletes : []);
  const fromServer = bundle.ideas.filter((i) => !pendingDeletes.has(i.id)).map((i) => ideaFromServer(i, me));
  const localNew = state.ideas
    .filter((i) => !serverIdeaIds.has(i.id) && (snap ? local!.ideaInserts.some((x) => x.id === i.id) : i.id !== 'idea-starter-1'))
    .map((i) => (isUuid(i.id) ? i : { ...i, id: crypto.randomUUID() }));
  next = { ...next, ideas: [...localNew, ...fromServer] };

  return next;
}

function isPristineTrial(r: TestingRow): boolean {
  return !r.voltage.trim() && !r.turns.trim() && !r.magnetCondition.trim() && r.ledLit !== 'Ya';
}

// ---------------------------------------------------------------------------
// Cadangan versi yang kalah (spec 6.1 no. 4), terpisah dari cadangan data pribadi
// ---------------------------------------------------------------------------
const GROUP_BACKUP_KEY = 'emodul_group_backup_v1';
const GROUP_BACKUP_TTL_MS = 7 * 24 * 60 * 60 * 1000;
interface GroupBackupEntry { groupId: string; savedAt: string; items: Record<string, unknown> }

/** Tambah entri cadangan; entri lebih tua dari 7 hari dan milik siswa lain dibuang. Maksimal 20 entri. */
export function saveGroupBackup(userId: string, groupId: string, items: Record<string, unknown>, now = Date.now()): void {
  if (!Object.keys(items).length) return;
  try {
    const entries = readGroupBackup(userId, now);
    entries.push({ groupId, savedAt: new Date(now).toISOString(), items });
    localStorage.setItem(GROUP_BACKUP_KEY, JSON.stringify({ userId, entries: entries.slice(-20) }));
  } catch {
    // kuota penuh: cadangan dilewati
  }
}
export function readGroupBackup(userId: string, now = Date.now()): GroupBackupEntry[] {
  try {
    const raw = localStorage.getItem(GROUP_BACKUP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { userId?: string; entries?: GroupBackupEntry[] };
    if (parsed.userId !== userId) return [];
    return (parsed.entries ?? []).filter((e) => now - new Date(e.savedAt).getTime() < GROUP_BACKUP_TTL_MS);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Penyimpanan lokal snapshot (per siswa + kelompok)
// ---------------------------------------------------------------------------
const STORE_KEY = 'emodul_group_sync_v1';
interface Stored { userId: string; groupId: string; snap: Snapshot; times: ChangeTimes }

/**
 * foreign = perangkat ini menyimpan data kelompok LAIN (siswa dipindah guru, atau siswa lain di perangkat
 * yang sama). Isian kelompok lokal harus dibuang dulu agar tidak terbawa ke kelompok ini.
 */
export function readGroupStore(userId: string, groupId: string): { snap: Snapshot | null; times: ChangeTimes; foreign: boolean } {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as Stored;
      if (s.userId === userId && s.groupId === groupId) return { snap: s.snap, times: s.times ?? {}, foreign: false };
      return { snap: null, times: {}, foreign: true };
    }
  } catch {
    // abaikan
  }
  return { snap: null, times: {}, foreign: false };
}

/** Kembalikan semua field kelompok ke nilai awal (dipakai saat data lokal milik kelompok lain). */
export function resetGroupFields(state: EModulState, initial: EModulState): EModulState {
  const next = { ...state } as Record<string, unknown>;
  for (const k of GROUP_STATE_KEYS) next[k] = (initial as unknown as Record<string, unknown>)[k];
  return next as unknown as EModulState;
}

/** Salin field kelompok dari `from` ke `to` (dipakai tombol Reset agar isian kelompok tidak ikut terhapus). */
export function keepGroupFields(to: EModulState, from: EModulState): EModulState {
  const next = { ...to } as Record<string, unknown>;
  for (const k of GROUP_STATE_KEYS) next[k] = (from as unknown as Record<string, unknown>)[k];
  return next as unknown as EModulState;
}

export function writeGroupStore(userId: string, groupId: string, snap: Snapshot, times: ChangeTimes): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ userId, groupId, snap, times }));
  } catch {
    // kuota penuh: snapshot tidak dipertahankan, aman karena dimuat ulang dari server
  }
}

export function clearGroupStore(): void {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    // abaikan
  }
}
