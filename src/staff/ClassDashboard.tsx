// Fase 5: dashboard satu kelas untuk guru. Data dibaca lewat view security_invoker (RLS tetap berlaku),
// jadi guru hanya melihat siswa dan kelompok sekolahnya sendiri.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, Download, Eye, FileText, Image as ImageIcon, Loader2, Printer, RefreshCw, Users, XCircle,
} from 'lucide-react';
import { staffClient } from './staffClient';
import { Modal, Notice, formatDateTime } from './StaffShell';
import { StudentManager } from './StudentManager';
import { openLoginCards } from './printLoginCards';
import {
  COLLABORATION_ITEMS, CREATIVITY_ITEMS, GROUP_ANSWERS, GUIDING_QUESTIONS, MIN_IDEAS_PER_MEMBER, PERSONAL_ANSWERS,
  PRESENTATION_POINTS, answersCsv, fileSlug, presentationPoint, progressCsv, registrationSpike, safeHttpUrl, screenLabel, studentStatus,
  text, type Dict, type GroupSummary, type ProgressRow,
} from './dashboardData';

const BUCKET = 'emodul-uploads';

interface ClassInfo { id: string; name: string; join_code: string }
type Tab = 'progress' | 'groups' | 'manage';

function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const today = () => new Date().toISOString().slice(0, 10);

const STATUS_CLS: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-800', locked: 'bg-rose-50 text-rose-700', pin: 'bg-amber-50 text-amber-800', disabled: 'bg-slate-100 text-slate-700',
};

export const ClassDashboard: React.FC<{ klass: ClassInfo; schoolName: string; schoolCode: string }> = ({ klass, schoolName, schoolCode }) => {
  const [tab, setTab] = useState<Tab>('progress');
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [student, setStudent] = useState<ProgressRow | null>(null);
  const [group, setGroup] = useState<GroupSummary | null>(null);

  const load = useCallback(async () => {
    if (!staffClient) return;
    setLoading(true);
    setError('');
    const [p, g] = await Promise.all([
      staffClient.from('v_class_progress').select('*').eq('class_id', klass.id).order('student_name').limit(1000),
      staffClient.from('v_group_summary').select('*').eq('class_id', klass.id).order('name'),
    ]);
    if (p.error || g.error) setError('Gagal memuat progres kelas. Coba muat ulang.');
    setRows((p.data ?? []) as ProgressRow[]);
    setGroups((g.data ?? []) as GroupSummary[]);
    setLoading(false);
  }, [klass.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const spike = useMemo(() => registrationSpike(rows.map((r) => r.created_at)), [rows]);
  const stats = useMemo(() => {
    const active = rows.filter((r) => r.status === 'active');
    const avg = active.length ? Math.round(active.reduce((a, r) => a + r.completion_percent, 0) / active.length) : 0;
    return {
      total: rows.length,
      avg,
      done: active.filter((r) => r.completion_percent >= 100).length,
      locked: rows.filter((r) => studentStatus(r).key === 'locked').length,
      noGroup: rows.filter((r) => !r.group_id).length,
    };
  }, [rows]);

  const exportProgress = () => download(`progres-${fileSlug(klass.name)}-${today()}.csv`, progressCsv(rows, klass.name));

  const exportAnswers = async () => {
    if (!staffClient) return;
    setExporting(true);
    setError('');
    try {
      const [st, gs] = await Promise.all([
        staffClient.from('students').select('id, student_state(data)').eq('class_id', klass.id).limit(1000),
        groups.length
          ? staffClient.from('group_state').select('group_id, data').in('group_id', groups.map((x) => x.group_id))
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (st.error || gs.error) throw new Error('load');
      const personal: Record<string, Dict> = {};
      for (const s of (st.data ?? []) as unknown as { id: string; student_state: { data: Dict } | { data: Dict }[] | null }[]) {
        const ss = Array.isArray(s.student_state) ? s.student_state[0] : s.student_state;
        personal[s.id] = ss?.data ?? {};
      }
      const groupData: Record<string, Dict> = {};
      for (const g of (gs.data ?? []) as { group_id: string; data: Dict }[]) groupData[g.group_id] = g.data ?? {};
      download(`jawaban-${fileSlug(klass.name)}-${today()}.csv`, answersCsv(rows, klass.name, personal, groupData));
    } catch {
      setError('Gagal menyiapkan rekap jawaban. Coba lagi.');
    } finally {
      setExporting(false);
    }
  };

  const printCards = () => {
    const ok = openLoginCards({ schoolName, schoolCode, className: klass.name, classCode: klass.join_code, siteUrl: window.location.origin });
    if (!ok) setError('Izinkan pop-up browser untuk mencetak kartu login.');
  };

  const tabBtn = (id: Tab, label: string) => (
    <button type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
      className={`px-4 py-2 rounded-md text-sm font-semibold cursor-pointer ${tab === id ? 'bg-white text-brand-700 border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}>
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      {spike && (
        <Notice tone="warning">
          <span className="inline-flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong>Lonjakan pendaftaran:</strong> {spike.count} akun baru mendaftar di kelas ini dalam satu jam
              ({formatDateTime(spike.from)} sampai {formatDateTime(spike.to)}). Periksa daftar siswa; bila ada pendaftar palsu,
              hapus akunnya dan ganti kode kelas.
            </span>
          </span>
        </Notice>
      )}

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Siswa', String(stats.total)],
          ['Rata-rata progres', `${stats.avg}%`],
          ['Selesai (100%)', String(stats.done)],
          ['Terkunci', String(stats.locked)],
        ].map(([k, v]) => (
          <div key={k} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
            <dt className="text-[11px] font-semibold text-slate-600">{k}</dt>
            <dd className="text-xl font-display font-bold text-slate-900">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 p-1 rounded-lg bg-slate-100" role="tablist" aria-label="Tampilan kelas">
          {tabBtn('progress', 'Progres')}
          {tabBtn('groups', 'Kelompok')}
          {tabBtn('manage', 'Kelola Siswa')}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={exportProgress} disabled={!rows.length} className="btn btn-secondary px-3 min-h-0 h-9 text-xs">
            <Download className="w-3.5 h-3.5" aria-hidden="true" /> Unduh progres (CSV)
          </button>
          <button type="button" onClick={() => void exportAnswers()} disabled={!rows.length || exporting} className="btn btn-secondary px-3 min-h-0 h-9 text-xs">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Download className="w-3.5 h-3.5" aria-hidden="true" />} Unduh jawaban (CSV)
          </button>
          <button type="button" onClick={printCards} className="btn btn-secondary px-3 min-h-0 h-9 text-xs">
            <Printer className="w-3.5 h-3.5" aria-hidden="true" /> Cetak kartu login
          </button>
          <button type="button" onClick={() => void load()} className="btn btn-secondary px-3 min-h-0 h-9 text-xs" aria-label="Muat ulang progres">
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {tab === 'manage' ? (
        <StudentManager classId={klass.id} />
      ) : loading ? (
        <p role="status" className="text-sm text-slate-600">Memuat progres...</p>
      ) : tab === 'progress' ? (
        rows.length === 0 ? (
          <Notice>Belum ada siswa. Bagikan kode kelas atau cetak kartu login.</Notice>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[760px] text-sm text-left">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th scope="col" className="px-3 py-2">Siswa</th>
                  <th scope="col" className="px-3 py-2">Kelompok</th>
                  <th scope="col" className="px-3 py-2 w-40">Progres</th>
                  <th scope="col" className="px-3 py-2">Layar terakhir</th>
                  <th scope="col" className="px-3 py-2">Masuk terakhir</th>
                  <th scope="col" className="px-3 py-2">Status</th>
                  <th scope="col" className="px-3 py-2"><span className="sr-only">Aksi</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((r) => {
                  const st = studentStatus(r);
                  return (
                    <tr key={r.student_id} data-nis={r.nis}>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-900">{r.student_name}</div>
                        <div className="text-[11px] font-mono text-slate-600">{r.nis}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-700">{r.group_name ?? <span className="text-slate-500">Tanpa kelompok</span>}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={r.completion_percent} aria-valuemin={0} aria-valuemax={100} aria-label={`Progres ${r.student_name}`}>
                            <div className="h-full bg-brand-600" style={{ width: `${r.completion_percent}%` }} />
                          </div>
                          <span className="text-xs font-mono font-semibold text-slate-800 w-9 text-right">{r.completion_percent}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-700">{screenLabel(r.current_screen)}</td>
                      <td className="px-3 py-2 text-xs text-slate-700">{formatDateTime(r.last_login_at)}</td>
                      <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${STATUS_CLS[st.key]}`}>{st.text}</span></td>
                      <td className="px-3 py-2 text-right">
                        <button type="button" onClick={() => setStudent(r)} className="btn btn-secondary px-3 min-h-0 h-8 text-xs" aria-label={`Lihat jawaban ${r.student_name}`}>
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" /> Jawaban
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : groups.length === 0 ? (
        <Notice>Belum ada kelompok. Kelompok dibuat otomatis saat siswa mendaftar.</Notice>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stats.noGroup > 0 && (
            <div className="md:col-span-2"><Notice tone="warning">{stats.noGroup} siswa belum punya kelompok. Pindahkan lewat tab Kelola Siswa.</Notice></div>
          )}
          {groups.map((g) => <GroupCard key={g.group_id} g={g} onOpen={() => setGroup(g)} />)}
        </div>
      )}

      {student && <StudentAnswers row={student} onClose={() => setStudent(null)} />}
      {group && <GroupDetail g={group} onClose={() => setGroup(null)} />}
    </div>
  );
};

// ---------------------------------------------------------------------------
const Flag: React.FC<{ ok: boolean; label: string; icon: React.ReactNode }> = ({ ok, label, icon }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
    {icon}
    <span>{label}</span>
    <span className="sr-only">{ok ? 'ada' : 'belum ada'}</span>
    {ok ? <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> : <XCircle className="w-3 h-3" aria-hidden="true" />}
  </span>
);

const DESIGN_CLS: Record<string, string> = {
  Ya: 'bg-emerald-50 text-emerald-800', Sebagian: 'bg-amber-50 text-amber-800', Belum: 'bg-rose-50 text-rose-700',
};

const GroupCard: React.FC<{ g: GroupSummary; onOpen: () => void }> = ({ g, onOpen }) => (
  <article className="p-4 rounded-xl border border-slate-200 space-y-3" aria-label={`Kelompok ${g.name}`}>
    <div className="flex items-start justify-between gap-2">
      <div>
        <h3 className="font-display font-bold text-slate-900">{g.name}</h3>
        <p className="text-xs text-slate-600 flex items-center gap-1"><Users className="w-3.5 h-3.5" aria-hidden="true" /> {g.member_count} anggota · {g.idea_count} ide · {g.filled_trial_count}/{g.trial_count} baris uji terisi</p>
      </div>
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${g.design_status ? DESIGN_CLS[g.design_status] : 'bg-slate-100 text-slate-600'}`}>
        {g.design_status ? `Desain V1: ${g.design_status}` : 'Desain belum diuji'}
      </span>
    </div>
    <div>
      <div className="text-[11px] font-semibold text-slate-600 mb-1">Ide per anggota (minimal {MIN_IDEAS_PER_MEMBER})</div>
      <div className="flex flex-wrap gap-1.5">
        {g.ideas_per_member.length === 0 && <span className="text-xs text-slate-500">Belum ada anggota aktif.</span>}
        {g.ideas_per_member.map((m) => (
          <span key={m.student_id} className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${m.ideas >= MIN_IDEAS_PER_MEMBER ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
            {m.name}: {m.ideas}
          </span>
        ))}
      </div>
    </div>
    <div className="flex flex-wrap gap-1.5">
      <Flag ok={g.has_design_sketch} label="Sketsa" icon={<ImageIcon className="w-3 h-3" aria-hidden="true" />} />
      <Flag ok={g.has_process_photo} label="Foto proses" icon={<ImageIcon className="w-3 h-3" aria-hidden="true" />} />
      <Flag ok={g.has_prototype_photo} label="Foto prototipe" icon={<ImageIcon className="w-3 h-3" aria-hidden="true" />} />
      <Flag ok={g.has_lab_report} label="Laporan" icon={<FileText className="w-3 h-3" aria-hidden="true" />} />
    </div>
    <button type="button" onClick={onOpen} className="btn btn-secondary px-3 min-h-0 h-8 text-xs" aria-label={`Lihat isian kelompok ${g.name}`}>
      <Eye className="w-3.5 h-3.5" aria-hidden="true" /> Lihat isian kelompok
    </button>
  </article>
);

// ---------------------------------------------------------------------------
const QA: React.FC<{ q: string; a: unknown }> = ({ q, a }) => (
  <div className="space-y-0.5">
    <dt className="text-xs font-bold text-slate-700">{q}</dt>
    <dd className={`text-sm whitespace-pre-wrap break-words ${text(a) ? 'text-slate-900' : 'text-slate-400 italic'}`}>{text(a) || 'Belum diisi'}</dd>
  </div>
);

const Scores: React.FC<{ title: string; items: readonly (readonly [string, string])[]; data: Dict | undefined }> = ({ title, items, data }) => (
  <div className="space-y-1">
    <div className="text-xs font-bold text-slate-700">{title} (skala 1-4)</div>
    <div className="flex flex-wrap gap-1.5">
      {items.map(([k, l]) => {
        const v = typeof data?.[k] === 'number' && (data[k] as number) > 0 ? (data[k] as number) : null;
        return <span key={k} className="px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">{l}: {v ?? '-'}</span>;
      })}
    </div>
  </div>
);

const StudentAnswers: React.FC<{ row: ProgressRow; onClose: () => void }> = ({ row, onClose }) => {
  const [data, setData] = useState<Dict | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    staffClient?.from('student_state').select('data').eq('student_id', row.student_id).maybeSingle()
      .then(({ data: d, error }) => (error ? setFailed(true) : setData((d?.data as Dict) ?? {})));
  }, [row.student_id]);
  const guiding = (data?.guidingAnswers as Dict | undefined) ?? {};
  return (
    <Modal title={`Jawaban ${row.student_name}`} onClose={onClose} wide>
      <p className="text-xs text-slate-600">NIS {row.nis} · {row.group_name ?? 'Tanpa kelompok'} · Progres {row.completion_percent}% · Terakhir menyimpan {formatDateTime(row.state_updated_at)}</p>
      {failed ? <Notice tone="error">Gagal memuat jawaban.</Notice> : !data ? <p role="status" className="text-sm text-slate-600">Memuat...</p> : (
        <dl className="space-y-3">
          <QA q={PERSONAL_ANSWERS[0][1]} a={data.initialHypothesis} />
          <div className="space-y-2 pl-3 border-l-2 border-slate-200">
            {GUIDING_QUESTIONS.map((q, i) => <QA key={q} q={`${i + 1}. ${q}`} a={guiding[i] ?? guiding[String(i)]} />)}
          </div>
          {PERSONAL_ANSWERS.slice(1).map(([k, l]) => <QA key={k} q={l} a={data[k]} />)}
          <Scores title="Penilaian diri: kreativitas" items={CREATIVITY_ITEMS} data={data.creativityScores as Dict | undefined} />
          <Scores title="Penilaian diri: kolaborasi" items={COLLABORATION_ITEMS} data={data.collaborationScores as Dict | undefined} />
        </dl>
      )}
      <div className="flex justify-end"><button type="button" onClick={onClose} className="btn btn-primary px-4 py-2 text-sm">Tutup</button></div>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
interface GroupDetailData {
  data: Dict;
  roles: { role: string; member_name: string }[];
  trials: { id: string; trial_label: string; voltage: string; turns: string; speed: string; magnet_condition: string; led_lit: string }[];
  ideas: { id: string; author_name: string; title: string; description: string; idea_votes: { voter_id: string }[] }[];
}

const StaffImage: React.FC<{ path: string; alt: string }> = ({ path, alt }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    staffClient?.storage.from(BUCKET).createSignedUrl(path, 3600)
      .then(({ data, error }) => (error || !data ? setFailed(true) : setUrl(data.signedUrl)));
  }, [path]);
  if (failed) return <div className="h-28 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-[11px] text-slate-500">Gambar tidak dapat dimuat</div>;
  if (!url) return <div className="h-28 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-slate-400" aria-label="Memuat gambar" /></div>;
  return <a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={alt} data-stored="true" className="h-28 w-full object-cover rounded-lg border border-slate-200" /></a>;
};

const FILE_REFS = [
  ['designSketchFile', 'Sketsa desain'], ['processPhotoFile', 'Foto proses'], ['prototypePhotoFile', 'Foto prototipe'],
] as const;

const GroupDetail: React.FC<{ g: GroupSummary; onClose: () => void }> = ({ g, onClose }) => {
  const [d, setD] = useState<GroupDetailData | null>(null);
  const [failed, setFailed] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  useEffect(() => {
    const c = staffClient;
    if (!c) return;
    void Promise.all([
      c.from('group_state').select('data').eq('group_id', g.group_id).maybeSingle(),
      c.from('group_roles').select('role, member_name').eq('group_id', g.group_id),
      c.from('test_trials').select('id, trial_label, voltage, turns, speed, magnet_condition, led_lit').eq('group_id', g.group_id).order('sort_order').order('updated_at'),
      c.from('ideas').select('id, author_name, title, description, idea_votes(voter_id)').eq('group_id', g.group_id).order('created_at'),
    ]).then(async ([gs, roles, trials, ideas]) => {
      if (gs.error || roles.error || trials.error || ideas.error) {
        setFailed(true);
        return;
      }
      const data = (gs.data?.data as Dict) ?? {};
      setD({ data, roles: roles.data ?? [], trials: trials.data ?? [], ideas: (ideas.data ?? []) as GroupDetailData['ideas'] });
      const report = data.labReportFile as { path?: string; name?: string } | undefined;
      if (report?.path) {
        const r = await c.storage.from(BUCKET).createSignedUrl(report.path, 3600, { download: report.name || 'laporan' });
        if (r.data) setReportUrl(r.data.signedUrl);
      }
    });
  }, [g.group_id]);

  return (
    <Modal title={`Isian kelompok ${g.name}`} onClose={onClose} wide>
      {failed ? <Notice tone="error">Gagal memuat isian kelompok.</Notice> : !d ? <p role="status" className="text-sm text-slate-600">Memuat...</p> : (
        <div className="space-y-5">
          <section className="space-y-1.5">
            <h3 className="text-sm font-display font-bold text-slate-900">Peran</h3>
            <ul className="flex flex-wrap gap-1.5">
              {d.roles.map((r) => <li key={r.role} className="px-2 py-0.5 rounded-md border border-slate-200 text-xs"><strong>{r.role}:</strong> {r.member_name || '-'}</li>)}
            </ul>
          </section>
          <section className="space-y-1.5">
            <h3 className="text-sm font-display font-bold text-slate-900">Gambar dan laporan</h3>
            <div className="grid grid-cols-3 gap-2">
              {FILE_REFS.map(([k, l]) => {
                const ref = d.data[k] as { path?: string } | undefined;
                return (
                  <figure key={k} className="space-y-1">
                    {ref?.path ? <StaffImage path={ref.path} alt={`${l} kelompok ${g.name}`} /> : <div className="h-28 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-[11px] text-slate-500">Belum ada</div>}
                    <figcaption className="text-[11px] font-semibold text-slate-600">{l}</figcaption>
                  </figure>
                );
              })}
            </div>
            <p className="text-xs">
              Laporan praktikum: {reportUrl ? <a href={reportUrl} className="font-semibold text-brand-700 underline">Unduh laporan</a> : safeHttpUrl(d.data.labReportLink) ? <a href={safeHttpUrl(d.data.labReportLink)!} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline">Tautan laporan</a> : <span className="text-slate-500">belum ada</span>}
            </p>
          </section>
          <section className="space-y-1.5">
            <h3 className="text-sm font-display font-bold text-slate-900">Ide ({d.ideas.length})</h3>
            {d.ideas.length === 0 ? <p className="text-xs text-slate-500">Belum ada ide.</p> : (
              <ul className="space-y-1.5">
                {d.ideas.map((i) => (
                  <li key={i.id} className="text-sm"><strong>{i.title}</strong> <span className="text-xs text-slate-600">oleh {i.author_name} · {i.idea_votes.length} vote</span><div className="text-xs text-slate-700 whitespace-pre-wrap">{i.description}</div></li>
                ))}
              </ul>
            )}
          </section>
          <section className="space-y-1.5">
            <h3 className="text-sm font-display font-bold text-slate-900">Data uji</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs text-left min-w-[520px]">
                <thead className="bg-slate-50 text-slate-600"><tr>{['Percobaan', 'Tegangan', 'Lilitan', 'Kecepatan', 'Kondisi magnet', 'LED'].map((h) => <th key={h} scope="col" className="px-2 py-1.5">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {d.trials.map((t) => <tr key={t.id}>{[t.trial_label, t.voltage, t.turns, t.speed, t.magnet_condition, t.led_lit].map((v, idx) => <td key={idx} className="px-2 py-1.5">{v || '-'}</td>)}</tr>)}
                </tbody>
              </table>
            </div>
          </section>
          <dl className="space-y-3">
            {GROUP_ANSWERS.map(([k, l]) => <QA key={k} q={l} a={d.data[k]} />)}
          </dl>
          <section className="space-y-2">
            <h3 className="text-sm font-display font-bold text-slate-900">Poin presentasi</h3>
            <dl className="space-y-2">{PRESENTATION_POINTS.map(([k, l]) => <QA key={k} q={l} a={presentationPoint(d.data, k)} />)}</dl>
          </section>
        </div>
      )}
      <div className="flex justify-end"><button type="button" onClick={onClose} className="btn btn-primary px-4 py-2 text-sm">Tutup</button></div>
    </Modal>
  );
};
