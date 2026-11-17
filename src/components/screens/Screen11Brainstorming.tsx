import React, { useState } from 'react';
import { Lightbulb, Plus, ThumbsUp, Trash2, CheckCircle2, Cloud } from 'lucide-react';
import { useModul } from '../../context/ModulContext';
import { IdeaNote } from '../../types/emodul';

const NOTE_COLORS: Record<IdeaNote['color'], string> = {
  cyan: 'bg-cyan-50/90 dark:bg-cyan-950/50 border-cyan-300 dark:border-cyan-500/40 text-slate-800 dark:text-cyan-100 shadow-sm',
  amber: 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-300 dark:border-amber-500/40 text-slate-800 dark:text-amber-100 shadow-sm',
  emerald: 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-500/40 text-slate-800 dark:text-emerald-100 shadow-sm',
  indigo: 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-500/40 text-slate-800 dark:text-indigo-100 shadow-sm',
};

export const Screen11Brainstorming: React.FC = () => {
  const { state, addIdea, voteIdea, removeIdea, updateState } = useModul();
  const [authorName, setAuthorName] = useState(state.identity.studentName || '');
  const [title, setTitle] = useState('');
  const [driveMechanism, setDriveMechanism] = useState<IdeaNote['driveMechanism']>('Engkol Manual');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<IdeaNote['color']>('cyan');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    addIdea({
      authorName: authorName.trim() || 'Anggota Tim',
      title: title.trim(),
      driveMechanism,
      description: description.trim(),
      color,
    });
    setTitle('');
    setDescription('');
  };

  // Count ideas per member
  const memberCounts = state.ideas.reduce<Record<string, number>>((acc, item) => {
    acc[item.authorName] = (acc[item.authorName] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] clay-card p-6 sm:p-8 space-y-6">
        {/* Header & Rules */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="space-y-1.5">
            <div className="clay-badge inline-flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-mono font-bold">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>Papan Ide Digital • Penguatan Kreativitas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white">
              Brainstorming: “Sebanyak Mungkin Ide!”
            </h1>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 space-y-1 font-medium shadow-sm">
            <div className="font-extrabold text-amber-950 dark:text-amber-100">Aturan Emas Brainstorming:</div>
            <div>1. Jangan langsung menilai atau mengkritik ide teman.</div>
            <div>2. Setiap anggota harus menghasilkan minimal 2 ide desain.</div>
          </div>
        </div>

        {/* Add Idea Form + Member Contribution Counter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-5 rounded-2xl clay-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3.5 shadow-sm"
          >
            <div className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">TAMBAH CATATAN IDE BARU</div>

            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Nama Pengusul..."
                className="clay-input px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <select
                value={driveMechanism}
                onChange={(e) => setDriveMechanism(e.target.value as IdeaNote['driveMechanism'])}
                className="clay-input px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="Engkol Manual">Engkol Manual</option>
                <option value="Kincir Angin">Kincir Angin</option>
                <option value="Kincir Air">Kincir Air</option>
                <option value="Gravitasi / Beban">Gravitasi / Beban</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul Ide Desain (contoh: Generator Putar Ganda)"
              className="clay-input w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />

            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan cara kerja mekanisme magnet dan kumparan dalam idemu..."
              className="clay-input w-full px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                {(['cyan', 'amber', 'emerald', 'indigo'] as IdeaNote['color'][]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Warna kartu ${c}`}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition ${
                      c === 'cyan'
                        ? 'bg-cyan-500'
                        : c === 'amber'
                        ? 'bg-amber-500'
                        : c === 'emerald'
                        ? 'bg-emerald-500'
                        : 'bg-indigo-500'
                    } ${color === c ? 'border-slate-900 dark:border-white scale-110 shadow-md' : 'border-transparent opacity-60'}`}
                  />
                ))}
              </div>
              <button
                type="submit"
                className="clay-btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white font-bold text-xs shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Tempelkan Ide</span>
              </button>
            </div>

            {/* Member Idea Counter */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">STATISTIK IDE ANGGOTA (MIN. 2 IDE):</div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(memberCounts).map(([member, count]) => (
                  <span
                    key={member}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-mono border font-semibold ${
                      count >= 2
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                        : 'bg-amber-50 dark:bg-slate-900 border-amber-300 dark:border-slate-700 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {member}: {count} ide
                  </span>
                ))}
              </div>
            </div>
          </form>

          {/* Sticky Notes Board */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-400">
              <span>KUMPULAN IDE KELOMPOK ({state.ideas.length} IDE)</span>
              <span>Klik jempol untuk memberi vote ide terbaik</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {state.ideas.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border ${NOTE_COLORS[item.color]} flex flex-col justify-between gap-3`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono font-bold">
                      <span className="truncate">{item.authorName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-950/60 text-[10px] border border-black/5">
                        {item.driveMechanism}
                      </span>
                    </div>
                    <h3 className="text-sm font-display font-black text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">{item.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-300/40 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => voteIdea(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 dark:bg-slate-950/70 hover:bg-white text-xs font-bold text-amber-700 dark:text-amber-300 border border-slate-200 dark:border-transparent transition shadow-xs"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span className="font-mono">{item.votes}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => removeIdea(item.id)}
                      aria-label="Hapus ide"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Synthesize Final Idea + Record to Teacher Drive */}
        <div className="p-5 rounded-2xl clay-card bg-emerald-50/40 dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label htmlFor="final-idea" className="text-sm font-display font-bold text-slate-900 dark:text-white">
              Gabungkan Ide Menjadi Keputusan Desain Final Kelompok:
            </label>
            {state.driveSyncRecorded && (
              <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ide Final terekam untuk laporan guru
              </span>
            )}
          </div>
          <textarea
            id="final-idea"
            rows={2}
            value={state.finalSelectedIdea}
            onChange={(e) => updateState('finalSelectedIdea', e.target.value)}
            placeholder="Tuliskan gabungan ide terbaik yang disepakati kelompok untuk dibuat sketsanya..."
            className="clay-input w-full p-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => updateState('driveSyncRecorded', true)}
              className="clay-btn-emerald inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md"
            >
              <Cloud className="w-4 h-4" />
              <span>Rekam Ide Final ke Drive Guru</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

