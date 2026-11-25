import React, { useEffect, useState } from 'react';
import { LogOut, Moon, Sun, Zap } from 'lucide-react';

/** Kerangka halaman guru/admin: header sederhana, tema, tombol keluar. */
export const StaffShell: React.FC<{
  title: string;
  subtitle?: string;
  email?: string;
  onSignOut?: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, email, onSignOut, children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  );
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('emodul_theme', theme);
    } catch {
      // abaikan
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2.5 min-w-0 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500 truncate">{subtitle ?? 'E-Modul Fisika STEM'}</div>
              <div className="text-sm font-display font-bold text-slate-900 truncate">{title}</div>
            </div>
          </a>
          <div className="flex items-center gap-2 shrink-0">
            {email && <span className="hidden md:inline text-xs text-slate-600 truncate max-w-[220px]">{email}</span>}
            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              aria-label={theme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
              aria-pressed={theme === 'dark'}
              className="btn btn-secondary p-2 min-h-0 w-9 h-9"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" aria-hidden="true" /> : <Moon className="w-4 h-4 text-slate-600" aria-hidden="true" />}
            </button>
            {onSignOut && (
              <button type="button" onClick={onSignOut} className="btn btn-secondary px-3 min-h-0 h-9 text-xs">
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">{children}</main>
    </div>
  );
};

export const Notice: React.FC<{ tone?: 'error' | 'info' | 'success' | 'warning'; children: React.ReactNode }> = ({ tone = 'info', children }) => {
  const cls = {
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    info: 'bg-slate-50 border-slate-200 text-slate-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
  }[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`p-3 rounded-lg border text-sm font-medium ${cls}`}>
      {children}
    </div>
  );
};

export const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="card w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-display font-bold text-slate-900">{title}</h2>
        {children}
      </div>
    </div>
  );
};

export const CopyButton: React.FC<{ value: string; label?: string }> = ({ value, label = 'Salin' }) => {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          window.setTimeout(() => setDone(false), 1500);
        } catch {
          window.prompt('Salin kode ini:', value);
        }
      }}
      className="btn btn-secondary px-3 min-h-0 h-8 text-xs"
    >
      {done ? 'Tersalin' : label}
    </button>
  );
};

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
