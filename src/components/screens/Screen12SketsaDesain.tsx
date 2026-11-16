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
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
            <PencilRuler className="w-4 h-4" />
            <span>EDP Tahap Plan • Sketsa Desain</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            Sketsa & Rancangan Desain Generator
          </h1>
          <p className="text-sm text-slate-300">
            Lengkapi template rancangan teknis di bawah ini serta buat sketsa langsung atau unggah foto sketsa rancangan kelompokmu.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Structured Design Template */}
          <div className="lg:col-span-6 space-y-4">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-200">Nama desain:</span>
              <input
                type="text"
                value={state.designName}
                onChange={(e) => updateState('designName', e.target.value)}
                placeholder="Contoh: Gen-Flux Duo Pulley V1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-200">Prinsip fisika yang digunakan:</span>
              <textarea
                rows={2}
                value={state.designPhysicsPrinciple}
                onChange={(e) => updateState('designPhysicsPrinciple', e.target.value)}
                placeholder="Jelaskan penerapan Hukum Faraday, fluks magnetik, atau Hukum Lenz pada rancangan..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-200">Bahan yang diperlukan:</span>
              <textarea
                rows={2}
                value={state.designMaterials}
                onChange={(e) => updateState('designMaterials', e.target.value)}
                placeholder="Daftar magnet, kawat tembaga, CD bekas, kardus, LED, dll..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-200">Keunggulan desain:</span>
              <textarea
                rows={2}
                value={state.designAdvantages}
                onChange={(e) => updateState('designAdvantages', e.target.value)}
                placeholder="Mengapa rancangan ini lebih efektif atau stabil?"
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-200">Prediksi hasil:</span>
              <textarea
                rows={2}
                value={state.designPrediction}
                onChange={(e) => updateState('designPrediction', e.target.value)}
                placeholder="Perkiraan besar tegangan (Volt) dan kondisi nyala lampu LED..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </label>
          </div>

          {/* Interactive Sketch Pad & Photo Upload */}
          <div className="lg:col-span-6 rounded-2xl bg-slate-950 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-cyan-400">KANVAS SKETSA DIGITAL / UNGGAH FOTO DESAIN</span>
              <button
                type="button"
                onClick={clearCanvas}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
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
              className="w-full h-56 rounded-xl bg-[#070B14] border border-dashed border-slate-700 cursor-crosshair touch-none"
            />
            <p className="text-[11px] text-slate-400">
              Gambar sketsa desain langsung di kanvas biru di atas, atau unggah foto sketsa kertas di bawah ini.
            </p>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-xs font-semibold text-cyan-200 transition">
                <Upload className="w-4 h-4" />
                <span>Link Unggah Foto Desain (JPG/PNG)</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>

              {state.designSketchDataUrl && (
                <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Terunggah: {state.designSketchFileName || 'sketsa-desain'}</span>
                  </div>
                  <img
                    src={state.designSketchDataUrl}
                    alt="Pratinjau Sketsa Desain Generator"
                    className="w-full max-h-36 object-contain rounded-lg bg-[#070B14]"
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

