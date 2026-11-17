import React, { useRef, useState } from 'react';
import { PencilRuler, Upload, Eraser, CheckCircle2 } from 'lucide-react';
import { useModul } from '../../context/ModulContext';

export const Screen12SketsaDesain: React.FC = () => {
  const { state, updateState } = useModul();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * canvas.width) / rect.width;
    const y = ((e.clientY - rect.top) * canvas.height) / rect.height;
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
  };

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * canvas.width) / rect.width;
    const y = ((e.clientY - rect.top) * canvas.height) / rect.height;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!drawing) return;
    setDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      updateState('designSketchDataUrl', canvas.toDataURL('image/png'));
      updateState('designSketchFileName', 'sketsa-kanvas-digital.png');
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateState('designSketchDataUrl', '');
    updateState('designSketchFileName', '');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateState('designSketchDataUrl', reader.result);
        updateState('designSketchFileName', file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] clay-card p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="clay-badge inline-flex items-center gap-2 px-3 py-1 bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 text-xs font-mono font-bold">
            <PencilRuler className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>EDP TAHAP PLAN • SKETSA DESAIN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white">
            Sketsa & Rancangan Desain Generator
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Lengkapi template rancangan teknis di bawah ini serta buat sketsa langsung atau unggah foto sketsa rancangan kelompokmu.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Structured Design Template */}
          <div className="lg:col-span-6 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Nama Desain:</span>
              <input
                type="text"
                value={state.designName}
                onChange={(e) => updateState('designName', e.target.value)}
                placeholder="Contoh: Gen-Flux Duo Pulley V1"
                className="clay-input w-full px-3.5 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Prinsip Fisika yang Digunakan:</span>
              <textarea
                rows={2}
                value={state.designPhysicsPrinciple}
                onChange={(e) => updateState('designPhysicsPrinciple', e.target.value)}
                placeholder="Jelaskan penerapan Hukum Faraday, fluks magnetik, atau Hukum Lenz pada rancangan..."
                className="clay-input w-full p-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Bahan yang Diperlukan:</span>
              <textarea
                rows={2}
                value={state.designMaterials}
                onChange={(e) => updateState('designMaterials', e.target.value)}
                placeholder="Daftar magnet, kawat tembaga, CD bekas, kardus, LED, dll..."
                className="clay-input w-full p-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Keunggulan Desain:</span>
              <textarea
                rows={2}
                value={state.designAdvantages}
                onChange={(e) => updateState('designAdvantages', e.target.value)}
                placeholder="Mengapa rancangan ini lebih efektif atau stabil?"
                className="clay-input w-full p-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Prediksi Hasil:</span>
              <textarea
                rows={2}
                value={state.designPrediction}
                onChange={(e) => updateState('designPrediction', e.target.value)}
                placeholder="Perkiraan besar tegangan (Volt) dan kondisi nyala lampu LED..."
                className="clay-input w-full p-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </label>
          </div>

          {/* Interactive Sketch Pad & Photo Upload */}
          <div className="lg:col-span-6 rounded-2xl clay-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">KANVAS SKETSA DIGITAL / UNGGAH FOTO</span>
              <button
                type="button"
                onClick={clearCanvas}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Bersihkan</span>
              </button>
            </div>

            <canvas
              ref={canvasRef}
              width={480}
              height={260}
              onPointerDown={startDraw}
              onPointerMove={moveDraw}
              onPointerUp={endDraw}
              onPointerLeave={endDraw}
              className="w-full h-56 rounded-2xl bg-[#080D1A] border-2 border-slate-700/80 cursor-crosshair touch-none shadow-inner"
            />
            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
              Goreskan sketsa desain langsung di kanvas gelap di atas, atau unggah foto sketsa kertas kelompokmu di bawah ini.
            </p>

            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-500/15 dark:hover:bg-cyan-500/25 border-2 border-cyan-400/60 text-xs font-bold text-cyan-800 dark:text-cyan-200 transition shadow-xs">
                <Upload className="w-4 h-4 text-cyan-600" />
                <span>Unggah Foto Desain (JPG / PNG)</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>

              {state.designSketchDataUrl && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 font-mono font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Terunggah: {state.designSketchFileName || 'sketsa-desain'}</span>
                  </div>
                  <img
                    src={state.designSketchDataUrl}
                    alt="Pratinjau Sketsa Desain Generator"
                    className="w-full max-h-36 object-contain rounded-xl bg-[#070B14] border border-slate-700"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

