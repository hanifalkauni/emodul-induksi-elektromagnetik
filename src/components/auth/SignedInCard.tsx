// Kartu identitas siswa yang sudah masuk (mode online). Identitas berasal dari akun, tidak bisa diubah di sini.

import React, { useState } from 'react';
import { ArrowRight, Building2, GraduationCap, KeyRound, LogOut, User, Users } from 'lucide-react';
import { useStudentSession } from '../../context/StudentSessionContext';
import { useModul } from '../../context/ModulContext';
import { ChangePinDialog } from './ChangePinDialog';
import { confirmSignOut } from './signOut';

export const SignedInCard: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const { profile } = useStudentSession();
  const { signOutAndClear, hasLocalOnlyImages } = useModul();
  const [showPin, setShowPin] = useState(false);
  if (!profile) return null;

  const rows = [
    { icon: User, label: 'Nama', value: profile.name },
    { icon: GraduationCap, label: 'Kelas', value: profile.className || '-' },
    { icon: Users, label: 'Kelompok', value: profile.groupName || '-' },
    { icon: Building2, label: 'Sekolah', value: profile.schoolName },
  ];

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <dt className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <Icon className="w-4 h-4 text-brand-700" aria-hidden="true" /> {label}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="text-xs text-slate-600">
        NIS <span className="font-mono font-semibold text-slate-900">{profile.nis}</span> · Kode Sekolah{' '}
        <span className="font-mono font-semibold text-slate-900">{profile.schoolCode}</span>. Data diambil dari akun dan
        hanya bisa diubah guru.
      </p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowPin(true)} className="btn btn-secondary px-4 py-2.5 text-sm">
            <KeyRound className="w-4 h-4" aria-hidden="true" />
            <span>Ganti PIN</span>
          </button>
          <button
            type="button"
            onClick={() => confirmSignOut(hasLocalOnlyImages) && void signOutAndClear()}
            className="btn btn-secondary px-4 py-2.5 text-sm hover:text-rose-700 hover:border-rose-300"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>Keluar</span>
          </button>
        </div>
        <button type="button" onClick={onStart} className="btn btn-primary px-8 py-4 text-base font-display font-bold">
          <span>MULAI PEMBELAJARAN</span>
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {showPin && <ChangePinDialog onClose={() => setShowPin(false)} />}
    </div>
  );
};
