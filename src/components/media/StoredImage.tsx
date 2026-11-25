// Fase 4: tampilkan gambar kelompok (antrean lokal atau berkas Storage lewat signed URL) beserta status unggah.
import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, CloudUpload, Loader2 } from 'lucide-react';
import { useModul } from '../../context/ModulContext';
import { imageSource, signedUrl, type FileKind, type ImageKind } from '../../lib/media';

const REFRESH_MS = 50 * 60 * 1000; // signed URL berlaku 1 jam

export function useSignedUrl(path: string | undefined | null, download?: string): { url: string | null; failed: boolean } {
  const [res, setRes] = useState<{ url: string | null; failed: boolean }>({ url: null, failed: false });
  useEffect(() => {
    if (!path) {
      setRes({ url: null, failed: false });
      return;
    }
    let live = true;
    const load = () =>
      void signedUrl(path, download ? { download } : {}).then((url) => {
        if (live) setRes({ url, failed: !url });
      });
    load();
    const t = window.setInterval(load, REFRESH_MS);
    return () => {
      live = false;
      window.clearInterval(t);
    };
  }, [path, download]);
  return res;
}

export const StoredImage: React.FC<{ kind: ImageKind; alt: string; className: string }> = ({ kind, alt, className }) => {
  const { state } = useModul();
  const src = imageSource(state, kind);
  const signed = useSignedUrl(src.dataUrl ? null : src.ref?.path);
  if (src.dataUrl) return <img src={src.dataUrl} alt={alt} className={className} />;
  if (!src.ref) return null;
  if (signed.failed) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-50 text-[11px] font-semibold text-slate-500`} role="img" aria-label={alt}>
        Gambar tidak dapat dimuat.
      </div>
    );
  }
  if (!signed.url) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-50`} role="img" aria-label={`${alt} (memuat)`}>
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" aria-hidden="true" />
      </div>
    );
  }
  return <img src={signed.url} alt={alt} className={className} data-stored="true" />;
};

/** Baris status kecil: menunggu unggah, mengunggah, tersimpan di kelompok, atau galat. */
export const UploadStatusLine: React.FC<{ kind: FileKind; hasRef: boolean; hasLocal: boolean }> = ({ kind, hasRef, hasLocal }) => {
  const { uploadStatus, filesShared } = useModul();
  const s = uploadStatus[kind];
  if (s.phase === 'error') {
    return (
      <p role="alert" className="flex items-start gap-1.5 text-[11px] font-semibold text-rose-700">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden="true" />
        <span>{s.message}</span>
      </p>
    );
  }
  if (!filesShared) return null;
  if (s.phase === 'uploading') {
    return (
      <p role="status" className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Mengunggah ke kelompok...
      </p>
    );
  }
  if (hasLocal) {
    return (
      <p role="status" className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
        <CloudUpload className="w-3.5 h-3.5" aria-hidden="true" />
        {s.message ?? 'Tersimpan di perangkat, menunggu diunggah.'}
      </p>
    );
  }
  if (hasRef) {
    return (
      <p role="status" className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Tersimpan di kelompok
      </p>
    );
  }
  return null;
};
