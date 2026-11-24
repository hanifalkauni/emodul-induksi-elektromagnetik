// Dialog ganti PIN. Mode "forced" dipakai setelah guru mereset PIN (must_change_pin): tidak bisa ditutup
// dan tidak meminta PIN lama.

import React, { useEffect, useRef, useState } from 'react';
import { KeyRound, Loader2, X } from 'lucide-react';
import { useStudentSession } from '../../context/StudentSessionContext';
import { PinInput } from './PinInput';

interface Props {
  forced?: boolean;
  onClose?: () => void;
}

export const ChangePinDialog: React.FC<Props> = ({ forced = false, onClose }) => {
  const { changePin, acknowledgePinChanged } = useStudentSession();
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
    if (forced) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [forced, onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPin !== confirmPin) {
      setError('Konfirmasi PIN tidak sama.');
      return;
    }
    setBusy(true);
    try {
      await changePin({ oldPin: forced ? undefined : oldPin, newPin, newPinConfirm: confirmPin });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const finish = () => {
    acknowledgePinChanged();
    onClose?.();
  };

  const valid = /^\d{6}$/.test(newPin) && /^\d{6}$/.test(confirmPin) && (forced || /^\d{6}$/.test(oldPin));

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-pin-title"
        className="card w-full max-w-md p-6 space-y-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 id="change-pin-title" className="flex items-center gap-2 text-lg font-display font-bold text-slate-900">
              <KeyRound className="w-5 h-5 text-brand-700" aria-hidden="true" />
              {forced ? 'Buat PIN Baru' : 'Ganti PIN'}
            </h2>
            <p className="text-sm text-slate-600">
              {forced
                ? 'Guru telah mereset PIN Anda. Buat PIN baru 6 angka sebelum melanjutkan.'
                : 'Masukkan PIN lama, lalu PIN baru 6 angka.'}
            </p>
          </div>
          {!forced && (
            <button type="button" onClick={onClose} aria-label="Tutup" className="btn btn-secondary p-2 min-h-0 w-9 h-9">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {done ? (
          <div className="space-y-4">
            <p role="status" className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-800">
              PIN berhasil diganti. Gunakan PIN baru saat masuk berikutnya.
            </p>
            <button type="button" onClick={finish} className="btn btn-primary w-full px-5 py-3 text-sm">
              Lanjutkan
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            {!forced && (
              <PinInput ref={firstField} id="old-pin" label="PIN lama" value={oldPin} onChange={setOldPin} autoComplete="current-password" />
            )}
            <PinInput
              ref={forced ? firstField : undefined}
              id="new-pin"
              label="PIN baru (6 angka)"
              value={newPin}
              onChange={setNewPin}
              autoComplete="new-password"
              hint="Hindari angka berurutan (123456), angka sama (111111), atau bagian dari NIS."
            />
            <PinInput id="confirm-pin" label="Ulangi PIN baru" value={confirmPin} onChange={setConfirmPin} autoComplete="new-password" />

            {error && (
              <p role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm font-semibold text-rose-700">
                {error}
              </p>
            )}

            <button type="submit" disabled={!valid || busy} className="btn btn-primary w-full px-5 py-3 text-sm">
              {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              <span>Simpan PIN Baru</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
