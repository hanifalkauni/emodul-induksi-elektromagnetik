// Aturan sinkron data siswa (spec 6, 6.1). Fungsi murni + penyimpanan metadata lokal.
//
// Fase 1: semua isian non-identitas disimpan di student_state.data (termasuk isian kelompok sementara,
// lihat keputusan D26), KECUALI gambar base64 yang tetap hanya di perangkat sampai Fase 4.

import type { EModulState } from '../types/emodul';

/** Kolom yang tidak ikut disinkron: identitas berasal dari akun, gambar base64 terlalu besar. */
const EXCLUDED_KEYS = new Set<keyof EModulState>([
  'identity',
  'lastSavedAt',
  'currentScreen',
  'visitedScreens',
  'designSketchDataUrl',
  'processPhotoUrl',
  'prototypePhotoUrl',
]);

export const LOCAL_IMAGE_KEYS: (keyof EModulState)[] = ['designSketchDataUrl', 'processPhotoUrl', 'prototypePhotoUrl'];

export function toServerData(state: EModulState): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(state)) {
    if (!EXCLUDED_KEYS.has(key as keyof EModulState)) out[key] = value;
  }
  return out;
}

export function cleanVisited(list: number[]): number[] {
  return Array.from(new Set(list.filter((n) => Number.isInteger(n) && n >= 1 && n <= 17))).sort((a, b) => a - b);
}

export interface ServerStudentState {
  current_screen: number;
  visited_screens: number[];
  completion_percent: number;
  data: Record<string, unknown>;
  updated_at: string;
}

/** Terapkan data server ke state lokal. Identitas dan gambar lokal dipertahankan. */
export function applyServerState(local: EModulState, server: ServerStudentState): EModulState {
  const data = server.data ?? {};
  const merged = { ...local } as Record<string, unknown>;
  for (const [key, value] of Object.entries(data)) {
    if (!EXCLUDED_KEYS.has(key as keyof EModulState) && key in local) merged[key] = value;
  }
  const visited = cleanVisited([...(server.visited_screens ?? []), 1]);
  return {
    ...(merged as unknown as EModulState),
    identity: local.identity,
    currentScreen: Math.min(17, Math.max(1, server.current_screen || 1)),
    visitedScreens: visited,
    lastSavedAt: server.updated_at,
  };
}

/** Apakah data lokal berisi pekerjaan nyata (bukan state awal)? Dipakai untuk menawarkan impor. */
export function hasMeaningfulProgress(state: EModulState): boolean {
  return (
    state.visitedScreens.length > 1 ||
    state.checkedObjectives.length > 0 ||
    Boolean(state.initialHypothesis.trim()) ||
    Object.values(state.guidingAnswers).some((v) => Boolean(String(v).trim()))
  );
}

// ---------------------------------------------------------------------------
// Metadata sinkron di localStorage
// ---------------------------------------------------------------------------

export interface SyncMeta {
  /** Pemilik data lokal (id siswa). null = data mode lokal tanpa akun. */
  ownerId: string | null;
  /** Ada perubahan lokal yang belum terkirim. */
  dirty: boolean;
  /** Waktu perubahan lokal terakhir (jam perangkat). */
  localUpdatedAt: string | null;
  /** updated_at server dari sinkron terakhir yang sukses (jam server). */
  lastServerUpdatedAt: string | null;
}

const META_KEY = 'emodul_sync_meta_v1';
const BACKUP_KEY = 'emodul_backup_before_merge';
const BACKUP_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const EMPTY_META: SyncMeta = { ownerId: null, dirty: false, localUpdatedAt: null, lastServerUpdatedAt: null };

export function readMeta(): SyncMeta {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return { ...EMPTY_META, ...(JSON.parse(raw) as Partial<SyncMeta>) };
  } catch {
    // abaikan
  }
  return { ...EMPTY_META };
}

export function writeMeta(meta: SyncMeta): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // abaikan
  }
}

export function clearMeta(): void {
  try {
    localStorage.removeItem(META_KEY);
  } catch {
    // abaikan
  }
}

/** Simpan versi yang kalah saat konflik, berlaku 7 hari (spec 6.1 no. 4). */
export function saveBackup(ownerId: string, state: EModulState, reason: string): void {
  try {
    localStorage.setItem(
      BACKUP_KEY,
      JSON.stringify({ ownerId, reason, savedAt: new Date().toISOString(), expiresAt: Date.now() + BACKUP_TTL_MS, state }),
    );
  } catch {
    // kuota penuh: cadangan dilewati
  }
}

export function pruneExpiredBackup(): void {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (raw && (JSON.parse(raw) as { expiresAt?: number }).expiresAt! < Date.now()) localStorage.removeItem(BACKUP_KEY);
  } catch {
    localStorage.removeItem(BACKUP_KEY);
  }
}

// ---------------------------------------------------------------------------
// Keputusan penggabungan saat login / membuka aplikasi
// ---------------------------------------------------------------------------

export type MergeDecision =
  | { kind: 'push-local' } // data lokal lebih baru: kirim ke server
  | { kind: 'take-server'; backupLocal: boolean } // data server menang
  | { kind: 'ask-import' } // data mode lokal tanpa pemilik: tanya siswa
  | { kind: 'fresh' }; // tidak ada data apa pun

export function decideMerge(params: {
  userId: string;
  meta: SyncMeta;
  local: EModulState;
  server: ServerStudentState | null;
}): MergeDecision {
  const { userId, meta, local, server } = params;
  const serverHasData = Boolean(server && (server.visited_screens?.length > 1 || Object.keys(server.data ?? {}).length > 0));

  // Data lokal milik siswa lain (komputer lab bergantian): jangan digabung
  if (meta.ownerId && meta.ownerId !== userId) {
    return serverHasData ? { kind: 'take-server', backupLocal: false } : { kind: 'fresh' };
  }

  // Data mode lokal tanpa akun
  if (!meta.ownerId) {
    if (hasMeaningfulProgress(local)) return { kind: 'ask-import' };
    return serverHasData ? { kind: 'take-server', backupLocal: false } : { kind: 'fresh' };
  }

  // Pemilik sama
  if (!server || !serverHasData) return meta.dirty || hasMeaningfulProgress(local) ? { kind: 'push-local' } : { kind: 'fresh' };
  if (!meta.dirty) return { kind: 'take-server', backupLocal: false };

  const serverTime = new Date(server.updated_at).getTime();
  const lastKnown = meta.lastServerUpdatedAt ? new Date(meta.lastServerUpdatedAt).getTime() : 0;
  if (serverTime <= lastKnown) return { kind: 'push-local' }; // server tidak berubah sejak sinkron terakhir

  // Keduanya berubah: yang lebih baru menang, yang kalah dicadangkan
  const localTime = meta.localUpdatedAt ? new Date(meta.localUpdatedAt).getTime() : 0;
  return localTime > serverTime ? { kind: 'push-local' } : { kind: 'take-server', backupLocal: true };
}
