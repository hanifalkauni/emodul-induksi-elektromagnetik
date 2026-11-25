import React, { useEffect, useState } from 'react';
import {
  Home,
  PlayCircle,
  FlaskConical,
  Lightbulb,
  Users,
  ClipboardCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  CheckCircle2,
  Database,
  RotateCcw,
  Zap,
  Map,
  Sun,
  Moon,
  LogOut,
  Cloud,
  CloudOff,
  Loader2,
  HardDrive,
} from 'lucide-react';
import { useStudentSession } from '../../context/StudentSessionContext';
import { confirmSignOut } from '../auth/signOut';
import type { SyncStatus } from '../../context/ModulContext';
import { SCREENS, useModul } from '../../context/ModulContext';
import { NavPillar } from '../../types/emodul';

const PILLAR_NAV: { id: NavPillar; label: string; icon: React.ComponentType<{ className?: string }>; targetScreen: number }[] = [
  { id: 'home', label: 'Home', icon: Home, targetScreen: 1 },
  { id: 'materi', label: 'Materi', icon: PlayCircle, targetScreen: 5 },
  { id: 'eksperimen', label: 'Eksperimen', icon: FlaskConical, targetScreen: 9 },
  { id: 'tantangan', label: 'Tantangan', icon: Lightbulb, targetScreen: 10 },
  { id: 'kolaborasi', label: 'Kolaborasi', icon: Users, targetScreen: 11 },
  { id: 'evaluasi', label: 'Evaluasi', icon: ClipboardCheck, targetScreen: 14 },
  { id: 'refleksi', label: 'Refleksi', icon: RefreshCw, targetScreen: 17 },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, setScreen, nextScreen, prevScreen, loadDemoData, resetAllData, completionPercent, syncStatus, signOutAndClear, hasLocalOnlyImages, groupShared } = useModul();
  const session = useStudentSession();
  const online = session.status === 'signedIn';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tema: terang (default) atau gelap. Disimpan di localStorage dan diterapkan sebagai class .dark pada <html>.
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('emodul_theme', theme);
    } catch {
      // abaikan jika penyimpanan tidak tersedia
    }
  }, [theme]);

  const isIdentityFilled =
    Boolean(state.identity.studentName?.trim()) &&
    Boolean(state.identity.studentClass?.trim()) &&
    Boolean(state.identity.groupName?.trim()) &&
    Boolean(state.identity.schoolName?.trim());

  const handleNavigateScreen = (targetId: number) => {
    if (targetId > 1 && !isIdentityFilled) {
      alert('Mohon lengkapi Nama siswa, Kelas, Kelompok, dan Sekolah pada halaman Cover terlebih dahulu, lalu klik tombol "MULAI PEMBELAJARAN".');
      return;
    }
    setScreen(targetId);
    setSidebarOpen(false);
  };

  const activeScreenMeta = SCREENS.find((s) => s.id === state.currentScreen) || SCREENS[0];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Buka Daftar Layar Modul"
              aria-expanded={sidebarOpen}
              className="lg:hidden btn btn-secondary p-2 min-h-0 w-10 h-10"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => setScreen(1)}
              className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer rounded-lg"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500 truncate">
                  E-Modul Fisika STEM
                </div>
                <div className="text-sm font-display font-bold text-slate-900 truncate">
                  Induksi Elektromagnetik
                </div>
              </div>
            </button>
          </div>

          {/* Right: progress & quick actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              title={theme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
              aria-label={theme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
              aria-pressed={theme === 'dark'}
              className="btn btn-secondary p-2 min-h-0 w-9 h-9"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={() => handleNavigateScreen(3)}
              title="Peta Perjalanan Belajar"
              aria-label="Peta Perjalanan Belajar"
              className="hidden sm:inline-flex btn btn-secondary px-2.5 lg:px-3 py-1.5 min-h-0 h-9 text-xs"
            >
              <Map className="w-4 h-4 text-brand-700" aria-hidden="true" />
              <span className="hidden lg:inline">Peta Belajar</span>
            </button>

            <div className="hidden md:flex items-center gap-2 px-3 h-9 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold">
              <span className="text-slate-600">Progres</span>
              <span className="font-mono text-brand-700">{completionPercent}%</span>
            </div>

            {!online && (
            <button
              type="button"
              onClick={loadDemoData}
              title="Isi contoh data lengkap untuk pratinjau"
              aria-label="Isi contoh data"
              className="hidden sm:inline-flex btn btn-secondary px-2.5 lg:px-3 py-1.5 min-h-0 h-9 text-xs"
            >
              <Database className="w-4 h-4 text-slate-500" aria-hidden="true" />
              <span className="hidden lg:inline">Contoh Data</span>
            </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (window.confirm(online
                  ? 'Reset jawaban pribadi di akun ini? Jawaban di server juga akan terhapus. Isian kelompok (Screen 9–16) tidak ikut terhapus.'
                  : 'Reset seluruh jawaban dan kembali ke Screen 1?')) {
                  resetAllData();
                }
              }}
              title="Reset semua isian"
              aria-label="Reset semua isian"
              className="btn btn-secondary p-2 min-h-0 w-9 h-9 text-slate-600 hover:text-rose-600 hover:border-rose-300"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Thin overall progress line */}
        <div className="h-0.5 bg-slate-100" role="progressbar" aria-label="Progres modul" aria-valuenow={completionPercent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-brand-600 transition-all duration-300" style={{ width: `${completionPercent}%` }} />
        </div>

        {/* Navigasi 7 pilar (semua ukuran layar) */}
        <nav aria-label="Navigasi Pilar Utama" className="relative border-t border-slate-200 bg-white px-3 py-1.5 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max mx-auto justify-center">
            {PILLAR_NAV.map((pillar) => {
              const Icon = pillar.icon;
              const isActive = activeScreenMeta.pillar === pillar.id;
              return (
                <button
                  key={pillar.id}
                  type="button"
                  onClick={() => handleNavigateScreen(pillar.targetScreen)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{pillar.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main Content Area with Left Screen Index Sidebar */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex gap-6 relative">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'fixed inset-y-0 left-0 z-50 w-72 bg-white p-4 border-r border-slate-200 overflow-y-auto' : 'hidden'
          } lg:block lg:static lg:w-64 lg:shrink-0`}
        >
          <div className="lg:sticky lg:top-24 space-y-4">
            {sidebarOpen && (
              <div className="flex items-center justify-between lg:hidden pb-2 border-b border-slate-200">
                <span className="font-display font-bold text-sm text-slate-900">Daftar Screen (1–17)</span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Tutup daftar screen"
                  className="btn btn-secondary p-1.5 min-h-0 w-8 h-8"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Student Identity */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500">
                Profil Siswa Aktif
              </div>
              <div className="text-sm font-semibold text-slate-900 truncate">
                {state.identity.studentName || 'Belum diisi'}
              </div>
              <div className="text-xs text-slate-600 truncate">
                {state.identity.studentClass ? `${state.identity.studentClass} • ` : ''}
                {state.identity.groupName || 'Kelompok belum dipilih'}
              </div>
              {online ? (
                <button
                  type="button"
                  onClick={() => confirmSignOut(hasLocalOnlyImages) && void signOutAndClear()}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" /> Keluar dari akun
                </button>
              ) : (
                <div className="mt-2 text-[11px] text-slate-500">Mode latihan (tanpa akun)</div>
              )}
            </div>

            {/* 17 Screen Stepper */}
            <nav
              aria-label="Navigasi 17 Screen"
              className="p-2 rounded-xl bg-white border border-slate-200 max-h-[calc(100vh-220px)] overflow-y-auto space-y-0.5"
            >
              <div className="px-2.5 pt-1.5 pb-2 text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500 flex items-center justify-between">
                <span>Navigasi 17 Screen</span>
                <span className="text-brand-700">{state.currentScreen}/17</span>
              </div>
              {SCREENS.map((scr) => {
                const isCurrent = state.currentScreen === scr.id;
                const isVisited = state.visitedScreens.includes(scr.id);
                return (
                  <button
                    key={scr.id}
                    type="button"
                    onClick={() => handleNavigateScreen(scr.id)}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left text-xs cursor-pointer transition-colors ${
                      isCurrent
                        ? 'bg-brand-50 text-brand-800 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                          isCurrent ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {scr.code}
                      </span>
                      <span className="truncate">{scr.shortTitle}</span>
                    </div>
                    {isVisited && !isCurrent && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-label="Sudah dikunjungi" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
        )}

        {/* Active Screen Stage */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Screen Phase Breadcrumb */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono font-semibold px-2.5 py-1 rounded-md bg-brand-600 text-white">
                SCREEN {activeScreenMeta.id} / 17
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-700 font-semibold">{activeScreenMeta.phase}</span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-slate-900 font-semibold hidden sm:inline">{activeScreenMeta.title}</span>
              {groupShared && state.currentScreen >= 9 && state.currentScreen <= 16 && (
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[11px] font-semibold">
                  <Users className="w-3 h-3" aria-hidden="true" /> Dibagikan dengan {state.identity.groupName || 'kelompok'}
                </span>
              )}
            </div>
            <SyncBadge status={syncStatus} />
          </div>

          {/* Screen Body */}
          <div className="flex-1">{children}</div>

          {/* Bottom Screen Stepper Bar */}
          <footer className="mt-8 pt-4 border-t border-slate-200">
            {state.currentScreen === 1 ? (
              <div className="flex items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600">
                <span>
                  Silakan isi identitas diri di atas, lalu klik tombol{' '}
                  <strong className="text-brand-700 font-semibold">"MULAI PEMBELAJARAN →"</strong> untuk masuk ke materi.
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={prevScreen}
                  disabled={state.currentScreen <= 1}
                  className="btn btn-secondary px-3 sm:px-4 py-2.5 text-sm"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  <span><span className="hidden sm:inline">Screen </span>Sebelumnya</span>
                </button>

                <div className="hidden sm:flex items-center gap-1.5">
                  {SCREENS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-label={`Ke Screen ${s.id}: ${s.shortTitle}`}
                      aria-current={s.id === state.currentScreen ? 'step' : undefined}
                      onClick={() => handleNavigateScreen(s.id)}
                      className={`h-2 rounded-full cursor-pointer transition-all ${
                        s.id === state.currentScreen
                          ? 'w-6 bg-brand-600'
                          : state.visitedScreens.includes(s.id)
                          ? 'w-2 bg-brand-300 hover:bg-brand-400'
                          : 'w-2 bg-slate-200 hover:bg-slate-300'
                      }`}
                    />
                  ))}
                </div>

                {state.currentScreen < 17 ? (
                  <button
                    type="button"
                    onClick={nextScreen}
                    className="btn btn-primary px-3 sm:px-5 py-2.5 text-sm"
                  >
                    <span><span className="hidden sm:inline">Screen </span>Selanjutnya</span>
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleNavigateScreen(3)}
                    className="btn btn-success px-3 sm:px-5 py-2.5 text-sm"
                  >
                    <Map className="w-4 h-4" aria-hidden="true" />
                    <span className="sm:hidden">Peta Belajar</span>
                    <span className="hidden sm:inline">Kembali ke Peta Belajar</span>
                  </button>
                )}
              </div>
            )}
          </footer>
        </main>
      </div>
    </div>
  );
};

const SYNC_LABEL: Record<SyncStatus, { text: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  local: { text: 'Tersimpan di perangkat', icon: HardDrive, tone: 'text-slate-600' },
  syncing: { text: 'Memuat data akun...', icon: Loader2, tone: 'text-slate-600' },
  saving: { text: 'Menyimpan...', icon: Loader2, tone: 'text-slate-600' },
  saved: { text: 'Tersinkron ke akun', icon: Cloud, tone: 'text-emerald-700' },
  offline: { text: 'Offline, disimpan di perangkat', icon: CloudOff, tone: 'text-amber-700' },
  error: { text: 'Belum tersinkron, mencoba lagi', icon: CloudOff, tone: 'text-rose-700' },
};

const SyncBadge: React.FC<{ status: SyncStatus }> = ({ status }) => {
  const { text, icon: Icon, tone } = SYNC_LABEL[status];
  const spinning = status === 'saving' || status === 'syncing';
  return (
    <div role="status" aria-live="polite" className={`flex items-center gap-2 text-[11px] font-mono font-medium ${tone}`}>
      <Icon className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`} aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
};
