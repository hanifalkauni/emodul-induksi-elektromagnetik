import React, { useState } from 'react';
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
} from 'lucide-react';
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
  const { state, setScreen, nextScreen, prevScreen, loadDemoData, resetAllData, completionPercent } = useModul();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeScreenMeta = SCREENS.find((s) => s.id === state.currentScreen) || SCREENS[0];

  return (
    <div className="min-h-screen bg-lab-grid text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0B1120]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Buka Daftar Layar Modul"
              className="lg:hidden p-2 rounded-lg bg-slate-800/70 border border-slate-700 text-slate-200 hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => setScreen(1)}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-amber-500/20 border border-cyan-500/40 flex items-center justify-center shadow-inner">
                <Zap className="w-5 h-5 text-cyan-400 group-hover:text-amber-400 transition-colors" />
              </div>
              <div className="truncate">
                <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                  E-Modul Fisika STEM
                </div>
                <div className="text-sm font-display font-bold text-slate-100 truncate">
                  Induksi Elektromagnetik
                </div>
              </div>
            </button>
          </div>

          {/* 7 Storyboard Pillar Navigation (Desktop) */}
          <nav aria-label="Navigasi Pilar Utama" className="hidden xl:flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1">
            {PILLAR_NAV.map((pillar) => {
              const Icon = pillar.icon;
              const isActive = activeScreenMeta.pillar === pillar.id;
              return (
                <button
                  key={pillar.id}
                  type="button"
                  onClick={() => setScreen(pillar.targetScreen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{pillar.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Student Telemetry & Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScreen(3)}
              title="Peta Perjalanan Belajar"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-200 hover:border-cyan-500/50 transition"
            >
              <Map className="w-3.5 h-3.5 text-cyan-400" />
              <span>Peta Belajar</span>
            </button>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400">Progres:</span>
              <span className="font-mono font-semibold text-emerald-400">{completionPercent}%</span>
            </div>

            <button
              type="button"
              onClick={loadDemoData}
              title="Isi contoh data lengkap untuk pratinjau"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 border border-slate-700 text-xs text-amber-300 transition"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Contoh Data</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset seluruh jawaban dan kembali ke Screen 1?')) {
                  resetAllData();
                }
              }}
              title="Reset semua isian"
              className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tablet/Mobile 7-Icon Bar */}
        <div className="xl:hidden border-t border-slate-800/80 bg-slate-900/70 px-3 py-1.5 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max mx-auto justify-center">
            {PILLAR_NAV.map((pillar) => {
              const Icon = pillar.icon;
              const isActive = activeScreenMeta.pillar === pillar.id;
              return (
                <button
                  key={pillar.id}
                  type="button"
                  onClick={() => setScreen(pillar.targetScreen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{pillar.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area with Left Screen Index Sidebar */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex gap-6 relative">
        {/* Desktop Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'fixed inset-y-0 left-0 z-50 w-72 bg-[#0B1120] p-4 border-r border-slate-800 overflow-y-auto' : 'hidden'
          } lg:block lg:static lg:w-64 lg:shrink-0`}
        >
          <div className="lg:sticky lg:top-24 space-y-4">
            {sidebarOpen && (
              <div className="flex items-center justify-between lg:hidden pb-2 border-b border-slate-800">
                <span className="font-display font-bold text-sm text-cyan-400">Daftar Screen (1–17)</span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Student Identity Pill */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Profil Siswa Aktif
              </div>
              <div className="text-sm font-semibold text-slate-100 truncate">
                {state.identity.studentName || 'Belum diisi'}
              </div>
              <div className="text-xs text-slate-400 truncate">
                {state.identity.studentClass ? `${state.identity.studentClass} • ` : ''}
                {state.identity.groupName || 'Kelompok belum dipilih'}
              </div>
            </div>

            {/* 17 Screen Stepper */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 max-h-[calc(100vh-220px)] overflow-y-auto space-y-1">
              <div className="px-2 pb-2 text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Navigasi 17 Screen</span>
                <span className="text-cyan-400">{state.currentScreen}/17</span>
              </div>
              {SCREENS.map((scr) => {
                const isCurrent = state.currentScreen === scr.id;
                const isVisited = state.visitedScreens.includes(scr.id);
                return (
                  <button
                    key={scr.id}
                    type="button"
                    onClick={() => {
                      setScreen(scr.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition ${
                      isCurrent
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                          isCurrent
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {scr.code}
                      </span>
                      <span className="truncate">{scr.shortTitle}</span>
                    </div>
                    {isVisited && !isCurrent && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Active Screen Stage */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Screen Phase Breadcrumb */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                SCREEN {activeScreenMeta.id} / 17
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-300 font-medium">{activeScreenMeta.phase}</span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-slate-200 font-semibold hidden sm:inline">{activeScreenMeta.title}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Tersimpan otomatis</span>
            </div>
          </div>

          {/* Screen Body */}
          <div className="flex-1">{children}</div>

          {/* Bottom Screen Stepper Bar */}
          <footer className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={prevScreen}
              disabled={state.currentScreen <= 1}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Screen Sebelumnya</span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5">
              {SCREENS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Ke Screen ${s.id}: ${s.shortTitle}`}
                  onClick={() => setScreen(s.id)}
                  className={`h-2 rounded-full transition-all ${
                    s.id === state.currentScreen
                      ? 'w-6 bg-cyan-400'
                      : state.visitedScreens.includes(s.id)
                      ? 'w-2 bg-emerald-500/70 hover:bg-emerald-400'
                      : 'w-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>

            {state.currentScreen < 17 ? (
              <button
                type="button"
                onClick={nextScreen}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-sm shadow-lg shadow-cyan-500/20 transition"
              >
                <span>Screen Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setScreen(3)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition"
              >
                <Map className="w-4 h-4" />
                <span>Kembali ke Peta Belajar</span>
              </button>
            )}
          </footer>
        </main>
      </div>
    </div>
  );
};

