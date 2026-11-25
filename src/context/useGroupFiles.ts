// Fase 4: unggah foto/sketsa/laporan kelompok ke Supabase Storage.
//
// Alur gambar: pilih/gambar -> kompres (<= 300 KB) -> simpan sebagai base64 di state (antrean lokal, tidak
// ikut sinkron) -> unggah -> catat di public.files -> referensi (FileRef) masuk group_state -> base64 dibuang.
// Gagal jaringan: base64 tetap di antrean dan dicoba ulang (online, interval, backoff).
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { EModulState, FileRef } from '../types/emodul';
import { studentClient } from '../lib/supabase';
import {
  ALL_IMAGE_KINDS, BUCKET, IMAGE_KINDS, LAB_REPORT, MAX_UPLOAD_BYTES, MediaError, blobToDataUrl, clearPending,
  compressImage, dataUrlToBlob, isFileRef, markPending, readPending, storagePath, unmarkPending,
  type FileKind, type ImageKind,
} from '../lib/media';

export type UploadPhase = 'idle' | 'queued' | 'uploading' | 'error';
export type UploadStatus = Record<FileKind, { phase: UploadPhase; message?: string }>;

const IDLE: UploadStatus = {
  design_sketch: { phase: 'idle' }, process_photo: { phase: 'idle' }, prototype_photo: { phase: 'idle' }, lab_report: { phase: 'idle' },
};
const RETRY_MIN_MS = 3000;
const RETRY_MAX_MS = 60_000;
const QUEUE_DEBOUNCE_MS = 1200;

interface Args {
  /** Siswa masuk akun dan punya kelompok (path unggah lengkap). */
  enabled: boolean;
  /** Muat awal data kelompok selesai (referensi berkas dari server sudah diketahui). */
  ready: boolean;
  userId: string | null;
  groupId: string | null;
  schoolId: string | null;
  classId: string | null;
  state: EModulState;
  setState: Dispatch<SetStateAction<EModulState>>;
}

const now = () => new Date().toISOString();
const errMsg = (e: unknown) => (e instanceof MediaError ? e.message : 'Gagal mengunggah. Akan dicoba lagi otomatis.');

export function useGroupFiles({ enabled, ready, userId, groupId, schoolId, classId, state, setState }: Args) {
  const [status, setStatus] = useState<UploadStatus>(IDLE);
  const stateRef = useRef(state);
  stateRef.current = state;
  const inFlight = useRef(false);
  const again = useRef(false);
  const timer = useRef<number | null>(null);
  const retryDelay = useRef(RETRY_MIN_MS);
  const askedFor = useRef<string | null>(null);
  const active = enabled && ready && Boolean(userId && groupId && schoolId && classId);
  const activeRef = useRef(active);
  activeRef.current = active;

  const setPhase = useCallback((kind: FileKind, phase: UploadPhase, message?: string) => {
    setStatus((s) => (s[kind].phase === phase && s[kind].message === message ? s : { ...s, [kind]: { phase, message } }));
  }, []);

  /** Hapus berkas lama (Storage + metadata). Kegagalan hanya menyisakan berkas yatim, tidak merusak data. */
  const removeStored = useCallback(async (path: string) => {
    const c = studentClient;
    if (!c) return;
    const [rm, del] = await Promise.all([
      c.storage.from(BUCKET).remove([path]),
      c.from('files').delete().eq('storage_path', path),
    ]);
    if (rm.error || del.error) console.warn('Berkas lama gagal dihapus:', rm.error?.message ?? del.error?.message);
  }, []);

  /** Unggah satu blob ke folder kelompok dan catat metadatanya. */
  const putBlob = useCallback(async (kind: FileKind, blob: Blob, name: string, ext: string): Promise<FileRef> => {
    const c = studentClient;
    if (!c || !userId || !groupId || !schoolId || !classId) throw new Error('not_ready');
    if (blob.size > MAX_UPLOAD_BYTES) throw new MediaError('Berkas lebih dari 2 MB.');
    const path = storagePath({ schoolId, classId, groupId, kind, ext });
    const up = await c.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false, cacheControl: '3600' });
    if (up.error) throw up.error;
    const fileName = name.slice(0, 200);
    const ins = await c.from('files').insert({
      group_id: groupId, kind, storage_path: path, file_name: fileName, size_bytes: blob.size, uploaded_by: userId,
    });
    if (ins.error) {
      await c.storage.from(BUCKET).remove([path]);
      throw ins.error;
    }
    return { path, name: fileName, size: blob.size, uploadedAt: now() };
  }, [userId, groupId, schoolId, classId]);

  // ---------------------------------------------------------------- proses antrean gambar
  const processQueue = useCallback(async () => {
    if (!activeRef.current || !userId || !groupId) return;
    if (inFlight.current) {
      again.current = true;
      return;
    }
    const p = readPending();
    const kinds = p && p.userId === userId && p.groupId === groupId ? p.kinds : [];
    if (!kinds.length) return;
    inFlight.current = true;
    let failed = false;
    try {
      for (const kind of kinds) {
        const k = IMAGE_KINDS[kind];
        const dataUrl = stateRef.current[k.dataKey];
        if (!dataUrl) {
          unmarkPending(userId, groupId, kind);
          setPhase(kind, 'idle');
          continue;
        }
        if (!navigator.onLine) {
          setPhase(kind, 'queued', 'Menunggu koneksi internet untuk diunggah.');
          failed = true;
          continue;
        }
        setPhase(kind, 'uploading');
        try {
          const blob = await dataUrlToBlob(dataUrl);
          const name = stateRef.current[k.nameKey] || `${kind}.jpg`;
          const ref = await putBlob(kind, blob, name, 'jpg');
          const cur = stateRef.current;
          const old = isFileRef(cur[k.refKey]) ? (cur[k.refKey] as FileRef) : null;
          const unchanged = cur[k.dataKey] === dataUrl; // siswa tidak mengganti gambar selama unggah
          setState((prev) => ({
            ...prev,
            [k.refKey]: ref,
            ...(prev[k.dataKey] === dataUrl ? { [k.dataKey]: '' } : {}),
            lastSavedAt: now(),
          }));
          if (unchanged) unmarkPending(userId, groupId, kind);
          if (old && old.path !== ref.path) void removeStored(old.path);
          setPhase(kind, unchanged ? 'idle' : 'queued');
        } catch (e) {
          failed = true;
          console.warn(`Unggah ${kind} gagal:`, (e as Error)?.message);
          setPhase(kind, e instanceof MediaError ? 'error' : 'queued', errMsg(e));
          if (e instanceof MediaError) {
            // tidak akan berhasil bila diulang: keluarkan dari antrean, gambar tetap di perangkat
            unmarkPending(userId, groupId, kind);
          }
        }
      }
    } finally {
      inFlight.current = false;
    }
    if (timer.current) window.clearTimeout(timer.current);
    if (again.current) {
      again.current = false;
      timer.current = window.setTimeout(() => void processQueue(), 300);
    } else if (failed) {
      timer.current = window.setTimeout(() => void processQueue(), retryDelay.current);
      retryDelay.current = Math.min(RETRY_MAX_MS, retryDelay.current * 2);
    } else {
      retryDelay.current = RETRY_MIN_MS;
      // gambar diganti selama unggah: kirim versi terbarunya
      const rest = readPending();
      if (rest && rest.userId === userId && rest.groupId === groupId && rest.kinds.length) {
        timer.current = window.setTimeout(() => void processQueue(), 300);
      }
    }
  }, [userId, groupId, putBlob, removeStored, setPhase, setState]);

  const schedule = useCallback((delay = QUEUE_DEBOUNCE_MS) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void processQueue(), delay);
  }, [processQueue]);

  // ---------------------------------------------------------------- saat aktif: data lama + antrean tertunda
  useEffect(() => {
    if (!active || !userId || !groupId) return;
    const key = `${userId}:${groupId}`;
    if (askedFor.current !== key) {
      askedFor.current = key;
      const s = stateRef.current;
      const p = readPending();
      // Antrean milik kelompok lama (siswa dipindah guru): gambarnya untuk kelompok lain, buang
      if (p && p.userId === userId && p.groupId !== groupId) {
        const drop = p.kinds;
        clearPending();
        if (drop.length) {
          setState((prev) => ({ ...prev, ...Object.fromEntries(drop.map((kind) => [IMAGE_KINDS[kind].dataKey, ''])) }));
        }
      } else if (p && p.userId !== userId) {
        clearPending();
      }
      const marked = new Set(p && p.userId === userId && p.groupId === groupId ? p.kinds : []);
      const dropped = new Set(p && p.userId === userId && p.groupId !== groupId ? p.kinds : []);
      const legacy = ALL_IMAGE_KINDS.filter((kind) => s[IMAGE_KINDS[kind].dataKey] && !marked.has(kind) && !dropped.has(kind));
      if (legacy.length) {
        const labels = legacy.map((kind) => IMAGE_KINDS[kind].label).join(', ');
        const replace = legacy.filter((kind) => isFileRef(s[IMAGE_KINDS[kind].refKey])).map((kind) => IMAGE_KINDS[kind].label);
        const ok = window.confirm(
          `Ada gambar di perangkat ini yang belum tersimpan di akun: ${labels}.\n\nUnggah ke kelompok sekarang agar bisa dilihat anggota lain dan tidak hilang?` +
            (replace.length ? `\n\nKelompok sudah punya ${replace.join(', ')}; versi dari perangkat ini akan menggantikannya.` : '') +
            '\n\n(Pilih "Batal" untuk menyimpannya di perangkat ini saja. Pertanyaan ini muncul lagi saat aplikasi dibuka.)',
        );
        if (ok) for (const kind of legacy) markPending(userId, groupId, kind);
      }
    }
    schedule(200);
    const onOnline = () => schedule(300);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('online', onOnline);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [active, userId, groupId, schedule, setState]);

  // ---------------------------------------------------------------- aksi dari layar
  /** Simpan gambar (foto atau hasil kanvas). Mengembalikan pesan galat untuk ditampilkan, atau null. */
  const setImage = useCallback(async (kind: ImageKind, source: Blob, name: string): Promise<string | null> => {
    const k = IMAGE_KINDS[kind];
    try {
      const compressed = await compressImage(source);
      const dataUrl = await blobToDataUrl(compressed);
      setState((prev) => ({ ...prev, [k.dataKey]: dataUrl, [k.nameKey]: name, lastSavedAt: now() }));
      if (enabled && userId && groupId) {
        markPending(userId, groupId, kind);
        setPhase(kind, 'queued', navigator.onLine ? undefined : 'Menunggu koneksi internet untuk diunggah.');
        schedule();
      }
      return null;
    } catch (e) {
      const message = e instanceof MediaError ? e.message : 'Gagal memproses gambar.';
      setPhase(kind, 'error', message);
      return message;
    }
  }, [enabled, userId, groupId, schedule, setPhase, setState]);

  /** Hapus gambar dari perangkat dan (bila ada) dari kelompok. */
  const clearImage = useCallback((kind: ImageKind) => {
    const k = IMAGE_KINDS[kind];
    const old = stateRef.current[k.refKey];
    setState((prev) => ({ ...prev, [k.dataKey]: '', [k.nameKey]: '', [k.refKey]: null, lastSavedAt: now() }));
    if (userId && groupId) unmarkPending(userId, groupId, kind);
    setPhase(kind, 'idle');
    if (activeRef.current && isFileRef(old)) void removeStored(old.path);
  }, [userId, groupId, removeStored, setPhase, setState]);

  /** Laporan praktikum (PDF atau foto, maks. 2 MB). Tidak diantrekan: perlu koneksi saat memilih. */
  const uploadLabReport = useCallback(async (file: File): Promise<string | null> => {
    if (!enabled) {
      setState((prev) => ({ ...prev, [LAB_REPORT.nameKey]: file.name, lastSavedAt: now() }));
      return null;
    }
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    const isImage = file.type.startsWith('image/');
    const fail = (message: string) => {
      setPhase('lab_report', 'error', message);
      return message;
    };
    if (!isPdf && !isImage) return fail('Jenis berkas tidak diizinkan. Gunakan PDF atau foto.');
    if (isPdf && file.size > MAX_UPLOAD_BYTES) return fail('Berkas PDF lebih dari 2 MB. Perkecil dulu atau tempel tautan Google Drive.');
    if (!activeRef.current) return fail('Data kelompok belum siap. Coba lagi sebentar.');
    if (!navigator.onLine) return fail('Butuh koneksi internet untuk mengunggah laporan.');
    setPhase('lab_report', 'uploading');
    try {
      const blob = isPdf ? new Blob([file], { type: 'application/pdf' }) : await compressImage(file);
      const name = isPdf ? file.name : file.name.replace(/\.[^.]+$/, '') + '.jpg';
      const ref = await putBlob('lab_report', blob, name, isPdf ? 'pdf' : 'jpg');
      const old = stateRef.current[LAB_REPORT.refKey];
      setState((prev) => ({ ...prev, [LAB_REPORT.refKey]: ref, [LAB_REPORT.nameKey]: ref.name, lastSavedAt: now() }));
      if (isFileRef(old) && old.path !== ref.path) void removeStored(old.path);
      setPhase('lab_report', 'idle');
      return null;
    } catch (e) {
      console.warn('Unggah laporan gagal:', (e as Error)?.message);
      return fail(e instanceof MediaError ? e.message : 'Gagal mengunggah laporan. Periksa koneksi lalu coba lagi.');
    }
  }, [enabled, putBlob, removeStored, setPhase, setState]);

  const clearLabReport = useCallback(() => {
    const old = stateRef.current[LAB_REPORT.refKey];
    setState((prev) => ({ ...prev, [LAB_REPORT.refKey]: null, [LAB_REPORT.nameKey]: '', lastSavedAt: now() }));
    setPhase('lab_report', 'idle');
    if (activeRef.current && isFileRef(old)) void removeStored(old.path);
  }, [removeStored, setPhase, setState]);

  return { status, setImage, clearImage, uploadLabReport, clearLabReport, active };
}
