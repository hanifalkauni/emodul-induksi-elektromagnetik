import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  hint?: string;
}

/** Kolom PIN 6 angka: keyboard angka di HP, hanya digit, dengan tombol tampil/sembunyi. */
export const PinInput = forwardRef<HTMLInputElement, Props>(({ id, label, value, onChange, autoComplete, hint }, ref) => {
  const [visible, setVisible] = useState(false);
  return (
    <label htmlFor={id} className="block space-y-1.5">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={visible ? 'text' : 'password'}
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="input w-full px-4 py-3 pr-12 text-base font-mono tracking-[0.4em]"
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-md text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          {visible ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
        </button>
      </div>
      {hint && (
        <span id={`${id}-hint`} className="block text-[11px] text-slate-500">
          {hint}
        </span>
      )}
    </label>
  );
});

PinInput.displayName = 'PinInput';
