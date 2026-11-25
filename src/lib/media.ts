// Fase 4: foto dan sketsa. Kompresi di browser, konfigurasi jenis berkas, signed URL, dan antrean unggah.
//
// Di mode online dengan kelompok, gambar disimpan di bucket privat `emodul-uploads` dan state hanya
// menyimpan referensinya (FileRef, kunci kelompok). Base64 di state dipakai sebagai ANTREAN lokal: berisi
// gambar yang sudah dikompres tetapi belum terunggah (mis. saat offline), lalu dikosongkan setelah terunggah.
// Di mode lokal (tanpa akun) base64 tetap menjadi tempat simpan gambar seperti sebelumnya.
import type { EModulState, FileRef } from '../types/emodul';
import { studentClient } from './supabase';

export const BUCKET = 'emodul-uploads';
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // sama dengan batas bucket (migrasi 0006)
export const TARGET_IMAGE_BYTES = 300 * 1024;
export const MAX_IMAGE_SIDE = 1280;

export type ImageKind = 'design_sketch' | 'process_photo' | 'prototype_photo';
export type FileKind = ImageKind | 'lab_report';

type DataKey = 'designSketchDataUrl' | 'processPhotoUrl' | 'prototypePhotoUrl';
type NameKey = 'designSketchFileName' | 'processPhotoName' | 'prototypePhotoName' | 'labReportFileName';
type RefKey = 'designSketchFile' | 'processPhotoFile' | 'prototypePhotoFile' | 'labReportFile';

export const IMAGE_KINDS: Record<ImageKind, { dataKey: DataKey; nameKey: NameKey; refKey: RefKey; label: string }> = {
  design_sketch: { dataKey: 'designSketchDataUrl', nameKey: 'designSketchFileName', refKey: 'designSketchFile', label: 'sketsa desain' },
  process_photo: { dataKey: 'processPhotoUrl', nameKey: 'processPhotoName', refKey: 'processPhotoFile', label: 'foto proses' },
  prototype_photo: { dataKey: 'prototypePhotoUrl', nameKey: 'prototypePhotoName', refKey: 'prototypePhotoFile', label: 'foto prototipe' },
};
export const LAB_REPORT = { nameKey: 'labReportFileName' as const, refKey: 'labReportFile' as const };
export const ALL_IMAGE_KINDS = Object.keys(IMAGE_KINDS) as ImageKind[];

// ---------------------------------------------------------------------------
// Kompresi
// ---------------------------------------------------------------------------
export class MediaError extends Error {}

async function decode(source: Blob): Promise<{ draw: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(source);
      return { draw: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      // lanjut ke <img> (Safari lama)
    }
  }
  const url = URL.createObjectURL(source);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return { draw: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw new MediaError('Format gambar tidak didukung. Gunakan foto JPG atau PNG.');
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new MediaError('Gagal memproses gambar.'))), 'image/jpeg', quality),
  );
}

/**
 * Perkecil gambar: sisi terpanjang maks. 1280 px, JPEG kualitas 0,8 lalu diturunkan sampai <= 300 KB.
 * Latar transparan (sketsa kanvas, PNG) diisi putih.
 */
export async function compressImage(source: Blob): Promise<Blob> {
  if (source.type && !source.type.startsWith('image/')) throw new MediaError('Berkas harus berupa gambar (JPG / PNG).');
  const img = await decode(source);
  try {
    let side = MAX_IMAGE_SIDE;
    let last: Blob | null = null;
    for (const quality of [0.8, 0.7, 0.6, 0.5]) {
      const scale = Math.min(1, side / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new MediaError('Browser tidak dapat memproses gambar.');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img.draw, 0, 0, canvas.width, canvas.height);
      last = await toBlob(canvas, quality);
      if (last.size <= TARGET_IMAGE_BYTES) return last;
      side = Math.round(side * 0.85);
    }
    if (last && last.size <= MAX_UPLOAD_BYTES) return last;
    throw new MediaError('Gambar terlalu besar setelah dikompres (maks. 2 MB).');
  } finally {
    img.close();
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new MediaError('Gagal membaca gambar.'));
    r.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

/** Perkiraan ukuran berkas dari data URL base64. */
export const dataUrlBytes = (dataUrl: string) => Math.floor(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4);

// ---------------------------------------------------------------------------
// Path dan signed URL
// ---------------------------------------------------------------------------
export function storagePath(p: { schoolId: string; classId: string; groupId: string; kind: FileKind; ext: string }): string {
  return `${p.schoolId}/${p.classId}/${p.groupId}/${p.kind}-${crypto.randomUUID()}.${p.ext}`;
}

const SIGNED_TTL_S = 60 * 60; // berumur pendek: 1 jam, diperbarui otomatis sebelum habis
const signedCache = new Map<string, { url: string; expiresAt: number }>();

export async function signedUrl(path: string, opts: { download?: string } = {}): Promise<string | null> {
  const c = studentClient;
  if (!c) return null;
  const cacheKey = opts.download ? `${path}#dl` : path;
  const hit = signedCache.get(cacheKey);
  if (hit && hit.expiresAt - Date.now() > 5 * 60 * 1000) return hit.url;
  const { data, error } = await c.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL_S, opts.download ? { download: opts.download } : undefined);
  if (error || !data?.signedUrl) return null;
  signedCache.set(cacheKey, { url: data.signedUrl, expiresAt: Date.now() + SIGNED_TTL_S * 1000 });
  return data.signedUrl;
}

export const forgetSignedUrls = () => signedCache.clear();

// ---------------------------------------------------------------------------
// Penanda antrean unggah: base64 mana yang dibuat saat masuk akun di kelompok ini
// (sisanya dianggap data lama dari mode lokal dan perlu konfirmasi sebelum diunggah).
// ---------------------------------------------------------------------------
const PENDING_KEY = 'emodul_pending_uploads_v1';
interface Pending { userId: string; groupId: string; kinds: ImageKind[] }

export function readPending(): Pending | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as Pending) : null;
  } catch {
    return null;
  }
}
function writePending(p: Pending | null) {
  try {
    if (!p || !p.kinds.length) localStorage.removeItem(PENDING_KEY);
    else localStorage.setItem(PENDING_KEY, JSON.stringify(p));
  } catch {
    // abaikan
  }
}
export function markPending(userId: string, groupId: string, kind: ImageKind) {
  const p = readPending();
  const kinds = p && p.userId === userId && p.groupId === groupId ? p.kinds : [];
  writePending({ userId, groupId, kinds: Array.from(new Set([...kinds, kind])) });
}
export function unmarkPending(userId: string, groupId: string, kind: ImageKind) {
  const p = readPending();
  if (!p || p.userId !== userId || p.groupId !== groupId) return;
  writePending({ ...p, kinds: p.kinds.filter((k) => k !== kind) });
}
export const clearPending = () => writePending(null);

export const isFileRef = (v: unknown): v is FileRef =>
  Boolean(v && typeof v === 'object' && typeof (v as FileRef).path === 'string' && (v as FileRef).path.length > 0);

/** Gambar yang ditampilkan: antrean lokal (belum terunggah) lebih dulu, lalu berkas kelompok. */
export function imageSource(state: EModulState, kind: ImageKind): { dataUrl: string; ref: FileRef | null; name: string } {
  const k = IMAGE_KINDS[kind];
  const ref = isFileRef(state[k.refKey]) ? (state[k.refKey] as FileRef) : null;
  const dataUrl = state[k.dataKey];
  return { dataUrl, ref, name: dataUrl ? state[k.nameKey] : ref?.name || state[k.nameKey] };
}
