import React from 'react';
import {
  Eye,
  HelpCircle,
  Compass,
  Cpu,
  FlaskConical,
  PencilRuler,
  Wrench,
  Users,
  Presentation,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useModul } from '../../context/ModulContext';

const JOURNEY_STEPS = [
  {
    step: 1,
    label: 'FENOMENA',
    description: 'Amati fenomena lampu menyala tanpa baterai yang disajikan dalam e-modul.',
    targetScreen: 5,
    icon: Eye,
    accent: 'bg-white border-slate-200 text-slate-900 hover:border-brand-300',
  },
  {
    step: 2,
    label: 'PERTANYAAN',
    description: 'Kenali rumusan masalah yang perlu kamu selesaikan bersama kelompok.',
    targetScreen: 5,
    icon: HelpCircle,
    accent: 'bg-white border-slate-200 text-slate-900 hover:border-brand-300',
  },
  {
    step: 3,
    label: 'EKSPLORASI',
    description: 'Pelajari konsep fluks magnetik dan hukum Faraday secara kuantitatif.',
    targetScreen: 6,
    icon: Compass,
    accent: 'bg-white border-slate-200 text-slate-900 hover:border-brand-300',
  },
  {
    step: 4,
    label: 'KONSEP',
    description: 'Coba simulasi Hukum Lenz untuk memahami arah arus induksi kawat depan.',
    targetScreen: 8,
    icon: Cpu,
    accent: 'bg-white border-slate-200 text-slate-900 hover:border-brand-300',
  },
  {
    step: 5,
    label: 'EKSPERIMEN',
    description: 'Lakukan eksperimen virtual kit untuk menguji pengaruh lilitan & kecepatan.',
    targetScreen: 9,
    icon: FlaskConical,
    accent: 'bg-white border-slate-200 text-slate-900 hover:border-brand-300',
  },
  {
    step: 6,
    label: 'ENGINEERING DESIGN',
    description: 'Pahami tantangan EDP merancang prototipe generator mini darurat.',
    targetScreen: 10,
    icon: PencilRuler,
    accent: 'bg-white border-slate-200 text-slate-900 hover:border-brand-300',
  },
  {
    step: 7,
    label: 'PROJECT (PRODUK)',
    description: 'Rancang prototipe generator magnet-kumparan sesuai sketsa desain.',
    targetScreen: 13,
    icon: Wrench,
    accent: 'bg-white border-slate-200 text-slate-900 hover:border-brand-300',
  },
  {
    step: 8,
    label: 'KOLABORASI PROYEK',
    description: 'Bekerja sama, curah gagasan (brainstorming), dan tetapkan peran tim.',
    targetScreen: 11,
    icon: Users,
    accent: 'bg-white border-slate-200 text-slate-900 hover:border-brand-300',
  },
  {
    step: 9,
    label: 'PRESENTASI',
    description: 'Presentasikan hasil pengujian prototipe kepada rekan dan guru.',
    targetScreen: 16,
    icon: Presentation,
    accent: 'bg-white border-slate-200 text-slate-900 hover:border-brand-300',
  },
  {
    step: 10,
    label: 'REFLEKSI',
    description: 'Evaluasi diri (kreativitas & kolaborasi) serta ekspor portofolio LKPD format PDF.',
    targetScreen: 17,
    icon: RefreshCw,
    accent: 'bg-white border-slate-200 text-slate-900 hover:border-brand-300',
  },
];

export const Screen03PetaPerjalanan: React.FC = () => {
  const { state, setScreen } = useModul();

  return (
    <div className="space-y-6">
      <div className="card p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <div className="badge inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 border-brand-200 text-brand-700 text-xs font-bold font-mono">
            <span>LEARNING JOURNEY ROADMAP (10 TAHAP STEM)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-slate-900">
            Peta Perjalanan Belajar
          </h1>
          <p className="text-sm font-medium text-slate-600 max-w-3xl leading-relaxed">
            Ikuti alur perjalanan belajar di bawah ini dari pengamatan fenomena awal hingga refleksi akhir. Klik salah satu kartu tahap untuk langsung meluncur ke layar pembelajaran terkait.
          </p>
        </div>

        {/* Visual S-Curve Journey Ribbon Overview */}
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 overflow-x-auto">
          <div className="min-w-[680px] space-y-4">
            {/* Row 1: Left -> Right */}
            <div className="grid grid-cols-5 gap-3">
              {JOURNEY_STEPS.slice(0, 5).map((item, idx) => {
                const visited = state.visitedScreens.includes(item.targetScreen);
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setScreen(item.targetScreen)}
                    className={`relative p-3.5 rounded-xl border ${item.accent} text-left cursor-pointer transition-colors`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
                      <span>TAHAP 0{item.step}</span>
                      {visited && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <div className="font-display font-bold text-xs text-slate-900">{item.label}</div>
                    {idx < 4 && (
                      <ArrowRight className="hidden md:block w-4 h-4 text-slate-400 absolute -right-3.5 top-1/2 -translate-y-1/2 z-10" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Row 2: Right -> Left serpentine flow visual */}
            <div className="grid grid-cols-5 gap-3">
              {[...JOURNEY_STEPS.slice(5, 10)].reverse().map((item) => {
                const visited = state.visitedScreens.includes(item.targetScreen);
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setScreen(item.targetScreen)}
                    className={`relative p-3.5 rounded-xl border ${item.accent} text-left cursor-pointer transition-colors`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
                      <span>TAHAP {item.step < 10 ? `0${item.step}` : item.step}</span>
                      {visited && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <div className="font-display font-bold text-xs text-slate-900">{item.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detailed Interactive Journey Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {JOURNEY_STEPS.map((item) => {
            const Icon = item.icon;
            const isVisited = state.visitedScreens.includes(item.targetScreen);
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setScreen(item.targetScreen)}
                className="group p-5 card card-hover text-left flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-brand-700">
                      TAHAP {item.step < 10 ? `0${item.step}` : item.step}
                    </span>
                    {isVisited && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Selesai</span>
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-brand-600 transition">
                    {item.label}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

