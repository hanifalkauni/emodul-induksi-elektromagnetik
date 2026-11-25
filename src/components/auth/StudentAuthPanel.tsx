// Panel masuk / daftar siswa (spec 3.2, 3.3). Masuk cukup NIS + PIN; Kode Sekolah hanya diminta bila
// NIS yang sama dipakai di beberapa sekolah (D17).

import React, { useRef, useState } from 'react';
import { Building2, Loader2, LogIn, UserPlus, Users, User, Hash, KeyRound } from 'lucide-react';
import { useStudentSession } from '../../context/StudentSessionContext';
import { ApiError } from '../../lib/authApi';
import { TURNSTILE_SITE_KEY } from '../../lib/supabase';
import { Turnstile, type TurnstileHandle } from './Turnstile';
import { PinInput } from './PinInput';

type Tab = 'login' | 'register';

const normalizeNis = (v: string) => v.replace(/\s+/g, '').toUpperCase().slice(0, 20);
const normalizeCode = (v: string) => v.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);

function Field(props: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
  mono?: boolean;
}) {
  const Icon = props.icon;
  return (
    <label htmlFor={props.id} className="block space-y-1.5">
      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
        <Icon className="w-4 h-4 text-brand-700" aria-hidden="true" /> {props.label}
      </span>
      <input
        id={props.id}
        type="text"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete ?? 'off'}
        autoCapitalize="characters"
        spellCheck={false}
        className={`input w-full px-4 py-3 text-sm ${props.mono ? 'font-mono tracking-wider' : ''}`}
        aria-describedby={props.hint ? `${props.id}-hint` : undefined}
      />
      {props.hint && (
        <span id={`${props.id}-hint`} className="block text-[11px] text-slate-500">
          {props.hint}
        </span>
      )}
    </label>
  );
}

export const StudentAuthPanel: React.FC<{ onUseLocal: () => void }> = ({ onUseLocal }) => {
  const { login, register, rememberedSchoolCode, forgetSchoolCode } = useStudentSession();
  const [tab, setTab] = useState<Tab>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [captcha, setCaptcha] = useState('');
  const captchaRef = useRef<TurnstileHandle>(null);

  // Masuk
  const [nis, setNis] = useState('');
  const [pin, setPin] = useState('');
  const [schoolCode, setSchoolCode] = useState(rememberedSchoolCode);
  const [needSchoolCode, setNeedSchoolCode] = useState(false);

  // Daftar
  const [classCode, setClassCode] = useState('');
  const [name, setName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regPin2, setRegPin2] = useState('');

  const switchTab = (next: Tab) => {
    setTab(next);
    setError('');
    setCaptcha(''); // widget dibuat ulang di tab baru, token lama tidak berlaku
  };

  const run = async (action: () => Promise<void>) => {
    setError('');
    setBusy(true);
    try {
      await action();
    } catch (err) {
      if (err instanceof ApiError && err.needSchoolCode) setNeedSchoolCode(true);
      setError((err as Error).message);
      captchaRef.current?.reset();
    } finally {
      setBusy(false);
    }
  };

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    void run(() =>
      login({ nis, pin, schoolCode: needSchoolCode || schoolCode ? schoolCode || undefined : undefined, captchaToken: captcha }),
    );
  };

  const submitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regPin !== regPin2) {
      setError('Konfirmasi PIN tidak sama.');
      return;
    }
    void run(() =>
      register({ classCode, nis, name, groupName, pin: regPin, pinConfirm: regPin2, captchaToken: captcha }),
    );
  };

  const loginValid = nis.length >= 4 && /^\d{6}$/.test(pin) && Boolean(captcha) && (!needSchoolCode || schoolCode.length === 6);
  const registerValid =
    classCode.length === 6 && nis.length >= 4 && name.trim().length >= 2 && groupName.trim().length >= 1 &&
    /^\d{6}$/.test(regPin) && regPin2.length === 6 && Boolean(captcha);

  const tabClass = (active: boolean) =>
    `flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${
      active ? 'bg-white text-brand-700 border border-slate-200' : 'text-slate-600 hover:text-slate-900'
    }`;

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Masuk atau daftar" className="flex gap-1 p-1 rounded-xl bg-slate-100">
        <button type="button" role="tab" aria-selected={tab === 'login'} onClick={() => switchTab('login')} className={tabClass(tab === 'login')}>
          <LogIn className="w-4 h-4" aria-hidden="true" /> Masuk
        </button>
        <button type="button" role="tab" aria-selected={tab === 'register'} onClick={() => switchTab('register')} className={tabClass(tab === 'register')}>
          <UserPlus className="w-4 h-4" aria-hidden="true" /> Daftar Baru
        </button>
      </div>

      {tab === 'login' ? (
        <form onSubmit={submitLogin} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field id="login-nis" label="NIS" icon={Hash} value={nis} onChange={(v) => setNis(normalizeNis(v))}
              placeholder="Nomor Induk Siswa" autoComplete="username" mono />
            <PinInput id="login-pin" label="PIN (6 angka)" value={pin} onChange={setPin} autoComplete="current-password" />
          </div>

          {(needSchoolCode || schoolCode) && (
            <div className="space-y-1.5">
              {needSchoolCode || !rememberedSchoolCode ? (
                <Field id="login-school" label="Kode Sekolah" icon={Building2} value={schoolCode}
                  onChange={(v) => setSchoolCode(normalizeCode(v))} placeholder="6 karakter dari guru" mono
                  hint="Diperlukan karena NIS ini terdaftar di lebih dari satu sekolah." />
              ) : (
                <p className="text-xs text-slate-600">
                  Kode Sekolah perangkat ini: <span className="font-mono font-semibold text-slate-900">{schoolCode}</span>{' '}
                  <button type="button" className="font-semibold text-brand-700 underline cursor-pointer"
                    onClick={() => { forgetSchoolCode(); setSchoolCode(''); }}>
                    hapus
                  </button>
                </p>
              )}
            </div>
          )}

          <Turnstile ref={captchaRef} siteKey={TURNSTILE_SITE_KEY} onToken={setCaptcha} />

          {error && (
            <p role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm font-semibold text-rose-700">{error}</p>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-600">Lupa PIN? Minta guru mereset PIN Anda.</p>
            <button type="submit" disabled={!loginValid || busy} className="btn btn-primary px-8 py-3.5 text-base font-display font-bold">
              {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              <span>Masuk</span>
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={submitRegister} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field id="reg-class" label="Kode Kelas" icon={KeyRound} value={classCode} onChange={(v) => setClassCode(normalizeCode(v))}
              placeholder="6 karakter dari guru" mono hint="Minta kode kelas kepada guru Anda." />
            <Field id="reg-nis" label="NIS" icon={Hash} value={nis} onChange={(v) => setNis(normalizeNis(v))}
              placeholder="Nomor Induk Siswa" autoComplete="username" mono />
            <Field id="reg-name" label="Nama Lengkap" icon={User} value={name} onChange={(v) => setName(v.slice(0, 100))}
              placeholder="Contoh: Alya Putri Pratama" autoComplete="name" />
            <Field id="reg-group" label="Kelompok" icon={Users} value={groupName} onChange={(v) => setGroupName(v.slice(0, 60))}
              placeholder="Contoh: Kelompok 3" hint="Tulis sama persis dengan teman sekelompok. Pindah kelompok hanya lewat guru." />
            <PinInput id="reg-pin" label="Buat PIN (6 angka)" value={regPin} onChange={setRegPin} autoComplete="new-password"
              hint="Hindari 123456, 111111, atau bagian dari NIS." />
            <PinInput id="reg-pin2" label="Ulangi PIN" value={regPin2} onChange={setRegPin2} autoComplete="new-password" />
          </div>

          <Turnstile ref={captchaRef} siteKey={TURNSTILE_SITE_KEY} onToken={setCaptcha} />

          {error && (
            <p role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm font-semibold text-rose-700">{error}</p>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-600">Ingat NIS dan PIN Anda untuk masuk di perangkat lain.</p>
            <button type="submit" disabled={!registerValid || busy} className="btn btn-primary px-8 py-3.5 text-base font-display font-bold">
              {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              <span>Daftar & Masuk</span>
            </button>
          </div>
        </form>
      )}

      <div className="pt-4 border-t border-slate-200 text-center">
        <button type="button" onClick={onUseLocal} className="text-sm font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer">
          Lanjut tanpa akun (mode latihan, jawaban hanya tersimpan di perangkat ini)
        </button>
        <p className="mt-3 text-xs text-slate-500">
          Anda guru? <a href="/guru" className="font-semibold text-brand-700 underline">Masuk ke halaman guru</a>
        </p>
      </div>
    </div>
  );
};
