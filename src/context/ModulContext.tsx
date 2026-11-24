import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { studentClient } from '../lib/supabase';
import { useStudentSession } from './StudentSessionContext';
import {
  LOCAL_IMAGE_KEYS,
  applyServerState,
  cleanVisited,
  clearMeta,
  decideMerge,
  pruneExpiredBackup,
  readMeta,
  saveBackup,
  toServerData,
  writeMeta,
  type ServerStudentState,
} from '../lib/studentSync';
import {
  EModulState,
  IdeaNote,
  RoleAssignment,
  ScreenMeta,
  TestingRow,
} from '../types/emodul';

const STORAGE_KEY = 'emodul_induksi_elektromagnetik_v1';

export const SCREENS: ScreenMeta[] = [
  { id: 1, code: 'S1', title: 'Cover & Identitas Siswa', shortTitle: 'Cover', pillar: 'home', phase: 'Orientasi' },
  { id: 2, code: 'S2', title: 'Petunjuk Penggunaan', shortTitle: 'Petunjuk', pillar: 'home', phase: 'Orientasi' },
  { id: 3, code: 'S3', title: 'Peta Perjalanan Belajar', shortTitle: 'Peta Belajar', pillar: 'home', phase: 'Orientasi' },
  { id: 4, code: 'S4', title: 'Tujuan Pembelajaran', shortTitle: 'Tujuan', pillar: 'home', phase: 'Orientasi' },
  { id: 5, code: 'S5', title: 'Pemantik: Fenomena & Hipotesis', shortTitle: 'Pemantik', pillar: 'materi', phase: 'Konsep & Simulasi' },
  { id: 6, code: 'S6', title: 'Eksplorasi Konsep: Fluks Magnetik', shortTitle: 'Fluks Magnetik', pillar: 'materi', phase: 'Konsep & Simulasi' },
  { id: 7, code: 'S7', title: 'Hukum Faraday & Simulator GGL', shortTitle: 'Hukum Faraday', pillar: 'materi', phase: 'Konsep & Simulasi' },
  { id: 8, code: 'S8', title: 'Hukum Lenz & Arah Arus Induksi', shortTitle: 'Hukum Lenz', pillar: 'materi', phase: 'Konsep & Simulasi' },
  { id: 9, code: 'S9', title: 'Eksperimen Learning Kit', shortTitle: 'Learning Kit', pillar: 'eksperimen', phase: 'Eksperimen Lab' },
  { id: 10, code: 'S10', title: 'Tantangan STEM: Generator Mini', shortTitle: 'Tantangan STEM', pillar: 'tantangan', phase: 'STEM EDP' },
  { id: 11, code: 'S11', title: 'Brainstorming Papan Ide Digital', shortTitle: 'Brainstorming', pillar: 'kolaborasi', phase: 'STEM EDP' },
  { id: 12, code: 'S12', title: 'Sketsa Desain Generator', shortTitle: 'Sketsa Desain', pillar: 'tantangan', phase: 'STEM EDP' },
  { id: 13, code: 'S13', title: 'Membuat Prototipe (Create)', shortTitle: 'Prototipe', pillar: 'kolaborasi', phase: 'STEM EDP' },
  { id: 14, code: 'S14', title: 'Testing & Uji Data Prototipe', shortTitle: 'Testing', pillar: 'evaluasi', phase: 'STEM EDP' },
  { id: 15, code: 'S15', title: 'Improve & Redesign (Versi 2)', shortTitle: 'Improve', pillar: 'tantangan', phase: 'STEM EDP' },
  { id: 16, code: 'S16', title: 'Presentasi Kelompok', shortTitle: 'Presentasi', pillar: 'kolaborasi', phase: 'Evaluasi & Refleksi' },
  { id: 17, code: 'S17', title: 'Refleksi Diri & Kolaborasi', shortTitle: 'Refleksi', pillar: 'refleksi', phase: 'Evaluasi & Refleksi' },
];

export const DEFAULT_ROLES: RoleAssignment[] = [
  { role: 'Leader', taskDescription: 'Mengatur pembagian tugas', memberName: '' },
  { role: 'Engineer', taskDescription: 'Menyiapkan alat', memberName: '' },
  { role: 'Data Analyst', taskDescription: 'Mencatat data', memberName: '' },
  { role: 'Experimenter', taskDescription: 'Melakukan percobaan', memberName: '' },
  { role: 'Communicator', taskDescription: 'Menyampaikan hasil', memberName: '' },
];

export const DEFAULT_TESTING_ROWS: TestingRow[] = [
  {
    id: 'trial-1',
    trialLabel: 'Uji Coba 1',
    voltage: '',
    turns: '',
    speed: 'Sedang',
    magnetCondition: '',
    ledLit: 'Tidak',
  },
];

export const INITIAL_STATE: EModulState = {
  currentScreen: 1,
  visitedScreens: [1],
  lastSavedAt: new Date().toISOString(),

  identity: {
    studentName: '',
    studentClass: '',
    groupName: '',
    schoolName: '',
  },

  checkedObjectives: [],

  initialHypothesis: '',
  guidingAnswers: {},

  fluxB: 1.0,
  fluxA: 0.2,
  fluxTheta: 30,
  fluxDefinitionAnswer: '',

  faradayTurns: 400,
  faradaySpeed: 5,
  faradayB: 1.2,
  faradayFactorAnswer: '',

  lenzPole: 'N',
  lenzMotion: 'approach',
  lenzAnswer: '',

  checkedTools: [],
  experimentStrategy: '',
  roles: DEFAULT_ROLES,
  labReportFileName: '',
  labReportLink: '',

  checkedConstraints: [],

  ideas: [
    {
      id: 'idea-starter-1',
      authorName: 'Contoh Ide',
      title: 'Generator Engkol Roda CD Bekas',
      driveMechanism: 'Engkol Manual',
      description: 'Menggunakan 2 keping CD bekas sebagai rotor bermagnet neodymium yang berputar di antara 2 kumparan statis.',
      color: 'cyan',
      votes: 2,
      createdAt: new Date().toISOString(),
    },
  ],
  finalSelectedIdea: '',
  driveSyncRecorded: false,

  designName: '',
  designPhysicsPrinciple: '',
  designMaterials: '',
  designAdvantages: '',
  designPrediction: '',
  designSketchDataUrl: '',
  designSketchFileName: '',

  processPhotoUrl: '',
  processPhotoName: '',
  prototypePhotoUrl: '',
  prototypePhotoName: '',
  testVideoLink: '',
  lmsUploadLink: '',

  testingRows: DEFAULT_TESTING_ROWS,
  designSuccessStatus: '',
  failureCauseAnalysis: '',

  improveWeakness: '',
  improveWhatToFix: '',
  improveNewIdeas: '',
  improvePlannedChanges: '',
  improveV2Voltage: '',
  improveV2LedStatus: '',
  improveDriveLink: '',

  presentationPoints: {
    masalah: '',
    ideAwal: '',
    konsepFisika: '',
    desain: '',
    prototype: '',
    dataPengujian: '',
    kegagalan: '',
    perbaikan: '',
    hasilAkhir: '',
  },
  presentationSlideLink: '',

  googleFormUrl: 'https://forms.gle/refleksi-emodul-induksi-elektromagnetik',
  creativityScores: {
    manyIdeas: 0,
    differentIdeas: 0,
    developToDesign: 0,
    improveAfterFail: 0,
    newSolution: 0,
  },
  collaborationScores: {
    contribute: 0,
    listen: 0,
    respect: 0,
    helpSolve: 0,
    responsible: 0,
  },
  bestContributionText: '',
  futureImprovementText: '',
};

interface ModulContextValue {
  state: EModulState;
  setScreen: (screenNumber: number) => void;
  nextScreen: () => void;
  prevScreen: () => void;
  updateState: <K extends keyof EModulState>(key: K, value: EModulState[K]) => void;
  updateIdentity: (patch: Partial<EModulState['identity']>) => void;
  addIdea: (idea: Omit<IdeaNote, 'id' | 'votes' | 'createdAt'>) => void;
  voteIdea: (id: string) => void;
  removeIdea: (id: string) => void;
  rotateRoles: () => void;
  loadDemoData: () => void;
  resetAllData: () => void;
  completionPercent: number;
  /** Status sinkron ke server: 'local' bila tidak masuk akun. */
  syncStatus: SyncStatus;
  /** Keluar akun: hapus data lokal milik siswa ini lalu akhiri sesi (spec 6.1 no. 1). */
  signOutAndClear: () => Promise<void>;
  /** true bila ada foto/sketsa yang hanya tersimpan di perangkat ini (belum ke server sampai Fase 4). */
  hasLocalOnlyImages: boolean;
}

export type SyncStatus = 'local' | 'syncing' | 'saving' | 'saved' | 'offline' | 'error';

const PUSH_DEBOUNCE_MS = 1500;
const MAX_RETRY_MS = 60_000;

const ModulContext = createContext<ModulContextValue | undefined>(undefined);

export const ModulProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<EModulState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<EModulState>;
        return {
          ...INITIAL_STATE,
          ...parsed,
          identity: { ...INITIAL_STATE.identity, ...(parsed.identity || {}) },
          creativityScores: { ...INITIAL_STATE.creativityScores, ...(parsed.creativityScores || {}) },
          collaborationScores: { ...INITIAL_STATE.collaborationScores, ...(parsed.collaborationScores || {}) },
          presentationPoints: { ...INITIAL_STATE.presentationPoints, ...(parsed.presentationPoints || {}) },
        };
      }
    } catch {
      // Fallback to initial state if storage is unavailable
    }
    return INITIAL_STATE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors on very large image previews
    }
  }, [state]);

  // ---------------------------------------------------------------------------
  // Sinkron ke Supabase (Fase 1): student_state milik siswa yang masuk.
  // ---------------------------------------------------------------------------
  const session = useStudentSession();
  const userId = session.userId;
  const profile = session.profile;
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local');

  const stateRef = useRef(state);
  stateRef.current = state;
  const readyForUser = useRef<string | null>(null); // penggabungan awal sudah selesai untuk user ini
  const applyingRemote = useRef(false);
  const pushTimer = useRef<number | null>(null);
  const retryDelay = useRef(2000);
  const inFlight = useRef(false);
  const pushAgain = useRef(false);

  const clearPushTimer = () => {
    if (pushTimer.current !== null) {
      window.clearTimeout(pushTimer.current);
      pushTimer.current = null;
    }
  };

  const pushNow = useCallback(async () => {
    const client = studentClient;
    const uid = readyForUser.current;
    if (!client || !uid) return;
    if (inFlight.current) {
      pushAgain.current = true;
      return;
    }
    inFlight.current = true;
    setSyncStatus('saving');
    const startedAt = readMeta().localUpdatedAt;
    const s = stateRef.current;
    const payload = {
      current_screen: s.currentScreen,
      visited_screens: cleanVisited(s.visitedScreens),
      completion_percent: Math.round((cleanVisited(s.visitedScreens).length / SCREENS.length) * 100),
      data: toServerData(s),
    };
    try {
      let { data, error } = await client
        .from('student_state').update(payload).eq('student_id', uid).select('updated_at').maybeSingle();
      if (!error && !data) {
        ({ data, error } = await client
          .from('student_state').insert({ student_id: uid, ...payload }).select('updated_at').single());
      }
      if (error || !data) throw error ?? new Error('Tidak ada respons');
      const meta = readMeta();
      if (meta.ownerId === uid) {
        if (meta.localUpdatedAt === startedAt) meta.dirty = false;
        meta.lastServerUpdatedAt = data.updated_at;
        writeMeta(meta);
      }
      retryDelay.current = 2000;
      setSyncStatus(meta.dirty ? 'saving' : 'saved');
    } catch (err) {
      console.warn('Sinkron gagal, akan dicoba lagi:', (err as Error)?.message);
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      clearPushTimer();
      pushTimer.current = window.setTimeout(() => void pushNow(), retryDelay.current);
      retryDelay.current = Math.min(MAX_RETRY_MS, retryDelay.current * 2);
    } finally {
      inFlight.current = false;
      if (pushAgain.current) {
        pushAgain.current = false;
        clearPushTimer();
        pushTimer.current = window.setTimeout(() => void pushNow(), 300);
      }
    }
  }, []);

  const schedulePush = useCallback(() => {
    clearPushTimer();
    pushTimer.current = window.setTimeout(() => void pushNow(), PUSH_DEBOUNCE_MS);
  }, [pushNow]);

  // Penggabungan awal setiap kali siswa (berbeda) masuk
  useEffect(() => {
    const client = studentClient;
    if (!client || !userId) {
      readyForUser.current = null;
      setSyncStatus('local');
      return;
    }
    if (readyForUser.current === userId) return;
    let cancelled = false;
    setSyncStatus('syncing');
    pruneExpiredBackup();

    (async () => {
      const { data: server, error } = await client
        .from('student_state')
        .select('current_screen, visited_screens, completion_percent, data, updated_at')
        .eq('student_id', userId)
        .maybeSingle<ServerStudentState>();
      if (cancelled) return;
      if (error) {
        setSyncStatus(navigator.onLine ? 'error' : 'offline');
        return; // dicoba lagi saat efek berjalan ulang (mis. koneksi kembali)
      }

      const meta = readMeta();
      const local = stateRef.current;
      let decision = decideMerge({ userId, meta, local, server: server ?? null });

      if (decision.kind === 'ask-import') {
        const ok = window.confirm(
          'Ada jawaban yang tersimpan di perangkat ini dari mode tanpa akun.\n\n' +
            'Pindahkan jawaban tersebut ke akun Anda?\n(Pilih "Batal" untuk memakai data akun dan membuang jawaban lokal.)',
        );
        decision = ok ? { kind: 'push-local' } : server ? { kind: 'take-server', backupLocal: true } : { kind: 'fresh' };
      }

      const ownerChanged = Boolean(meta.ownerId && meta.ownerId !== userId);
      const base = ownerChanged ? INITIAL_STATE : local;

      applyingRemote.current = true;
      if (decision.kind === 'take-server' && server) {
        if (decision.backupLocal) saveBackup(userId, local, 'konflik saat masuk');
        setState(applyServerState(base, server));
      } else if (decision.kind === 'fresh') {
        setState(ownerChanged ? INITIAL_STATE : base);
      } else {
        // push-local: data lokal dipertahankan dan dikirim
        applyingRemote.current = false;
      }

      writeMeta({
        ownerId: userId,
        dirty: decision.kind === 'push-local',
        localUpdatedAt: decision.kind === 'push-local' ? new Date().toISOString() : null,
        lastServerUpdatedAt: server?.updated_at ?? null,
      });
      readyForUser.current = userId;
      if (decision.kind === 'push-local') void pushNow();
      else setSyncStatus('saved');
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, pushNow]);

  // Identitas di mode online berasal dari akun (tidak bisa diubah siswa)
  useEffect(() => {
    if (!profile) return;
    setState((prev) => {
      const identity = {
        studentName: profile.name,
        studentClass: profile.className,
        groupName: profile.groupName,
        schoolName: profile.schoolName,
      };
      const same = Object.entries(identity).every(([k, v]) => prev.identity[k as keyof typeof identity] === v);
      return same ? prev : { ...prev, identity };
    });
  }, [profile]);

  // Tandai perubahan lokal lalu jadwalkan pengiriman
  useEffect(() => {
    if (applyingRemote.current) {
      applyingRemote.current = false;
      return;
    }
    const uid = readyForUser.current;
    if (!uid || !userId || uid !== userId) return;
    const meta = readMeta();
    writeMeta({ ...meta, ownerId: uid, dirty: true, localUpdatedAt: new Date().toISOString() });
    setSyncStatus('saving');
    schedulePush();
  }, [state, userId, schedulePush]);

  // Coba kirim lagi saat koneksi kembali
  useEffect(() => {
    const onOnline = () => {
      if (readyForUser.current && readMeta().dirty) void pushNow();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [pushNow]);

  useEffect(() => () => clearPushTimer(), []);

  const signOutAndClear = useCallback(async () => {
    clearPushTimer();
    readyForUser.current = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // abaikan
    }
    clearMeta();
    applyingRemote.current = true;
    setState(INITIAL_STATE);
    setSyncStatus('local');
    await session.signOut();
  }, [session]);

  const hasLocalOnlyImages = LOCAL_IMAGE_KEYS.some((k) => Boolean(state[k]));

  const setScreen = (screenNumber: number) => {
    const clamped = Math.max(1, Math.min(17, screenNumber));
    setState((prev) => ({
      ...prev,
      currentScreen: clamped,
      visitedScreens: prev.visitedScreens.includes(clamped)
        ? prev.visitedScreens
        : [...prev.visitedScreens, clamped],
      lastSavedAt: new Date().toISOString(),
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextScreen = () => setScreen(state.currentScreen + 1);
  const prevScreen = () => setScreen(state.currentScreen - 1);

  const updateState = <K extends keyof EModulState>(key: K, value: EModulState[K]) => {
    setState((prev) => ({
      ...prev,
      [key]: value,
      lastSavedAt: new Date().toISOString(),
    }));
  };

  const updateIdentity = (patch: Partial<EModulState['identity']>) => {
    setState((prev) => ({
      ...prev,
      identity: { ...prev.identity, ...patch },
      lastSavedAt: new Date().toISOString(),
    }));
  };

  const addIdea = (idea: Omit<IdeaNote, 'id' | 'votes' | 'createdAt'>) => {
    const newIdea: IdeaNote = {
      ...idea,
      id: `idea-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      votes: 0,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      ideas: [newIdea, ...prev.ideas],
      lastSavedAt: new Date().toISOString(),
    }));
  };

  const voteIdea = (id: string) => {
    setState((prev) => ({
      ...prev,
      ideas: prev.ideas.map((item) =>
        item.id === id ? { ...item, votes: item.votes + 1 } : item
      ),
      lastSavedAt: new Date().toISOString(),
    }));
  };

  const removeIdea = (id: string) => {
    setState((prev) => ({
      ...prev,
      ideas: prev.ideas.filter((item) => item.id !== id),
      lastSavedAt: new Date().toISOString(),
    }));
  };

  const rotateRoles = () => {
    setState((prev) => {
      const names = prev.roles.map((r) => r.memberName);
      if (names.every((n) => !n.trim())) return prev;
      const rotatedNames = [names[names.length - 1], ...names.slice(0, names.length - 1)];
      return {
        ...prev,
        roles: prev.roles.map((roleItem, idx) => ({
          ...roleItem,
          memberName: rotatedNames[idx],
        })),
        lastSavedAt: new Date().toISOString(),
      };
    });
  };

  const loadDemoData = () => {
    setState((prev) => ({
      ...prev,
      // Di mode online identitas berasal dari akun dan tidak ditimpa data contoh
      identity: profile
        ? prev.identity
        : {
            studentName: 'Alya Putri Pratama',
            studentClass: 'XII MIPA 2',
            groupName: 'Kelompok 3 (Faraday Squad)',
            schoolName: 'SMA Negeri 1 Nusantara',
          },
      checkedObjectives: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      initialHypothesis:
        'Gerakan magnet keluar-masuk kumparan menyebabkan perubahan medan magnet di dalam kumparan sehingga memicu munculnya arus listrik yang menyalakan LED.',
      fluxDefinitionAnswer:
        'Fluks magnetik adalah banyaknya garis gaya medan magnet yang menembus suatu luas penampang kumparan secara tegak lurus, dipengaruhi kuat medan B, luas A, dan sudut θ.',
      faradayFactorAnswer:
        'Kecepatan gerak magnet (ΔΦ/Δt) dan jumlah lilitan (N) sangat menentukan besar GGL induksi. Saat kecepatan dan lilitan diperbesar bersamaan, tegangan melonjak drastis.',
      lenzAnswer:
        'Saat kutub Utara didekatkan, kumparan membentuk kutub Utara untuk menolak sehingga arus induksi berlawanan arah jarum jam; saat dijauhkan, arah arus berbalik.',
      checkedTools: ['Magnet', 'Kumparan', 'Kabel', 'LED', 'Multimeter', 'Papan rangkaian'],
      experimentStrategy:
        'Menggunakan magnet neodymium berpasangan dengan kumparan 1000 lilitan serta menggerakkannya secepat dan selurus mungkin melewati pusat kumparan.',
      roles: [
        { role: 'Leader', taskDescription: 'Mengatur pembagian tugas', memberName: 'Alya Putri' },
        { role: 'Engineer', taskDescription: 'Menyiapkan alat', memberName: 'Bima Pratama' },
        { role: 'Data Analyst', taskDescription: 'Mencatat data', memberName: 'Citra Dewi' },
        { role: 'Experimenter', taskDescription: 'Melakukan percobaan', memberName: 'Dimas Wijaya' },
        { role: 'Communicator', taskDescription: 'Menyampaikan hasil', memberName: 'Eka Lestari' },
      ],
      checkedConstraints: ['magnet', 'kumparan', 'tegangan', 'bahan', 'aman'],
      finalSelectedIdea:
        'Generator Mini Rotor Ganda Berbasis Roda CD Bekas + Sistem Pulley Rasio 1:4 untuk mempercepat putaran magnet melewati 2 kumparan seri.',
      designName: 'Gen-Flux Duo Pulley V1',
      designPhysicsPrinciple:
        'Hukum Faraday (ε = -N ΔΦ/Δt) dengan mempercepat ω putaran rotor lewat rasio pulley 1:4 dan menambah jumlah lilitan N.',
      designMaterials: '2 CD bekas, 4 magnet Neodymium, kawat email tembaga 0.3 mm (800 lilitan), karet gelang, stik es krim, LED 3mm, papan kardus tebal.',
      designAdvantages: 'Putaran engkol lambat menghasilkan putaran magnet 4x lebih cepat pada rotor; mudah dirakit dari bahan bekas.',
      designPrediction: 'Mampu menghasilkan tegangan 2.4 V - 3.0 V dan menyalakan LED merah secara terang.',
      testingRows: [
        { id: 't1', trialLabel: 'Uji V1 (300 lilitan)', voltage: '1.1 V', turns: '300', speed: 'Sedang', magnetCondition: '2 Magnet Ferrite', ledLit: 'Tidak' },
        { id: 't2', trialLabel: 'Uji V1 (600 lilitan)', voltage: '1.9 V', turns: '600', speed: 'Cepat', magnetCondition: '4 Magnet Neodymium', ledLit: 'Ya' },
      ],
      designSuccessStatus: 'Sebagian',
      failureCauseAnalysis:
        'Lampu LED sempat berkedip redup karena celah antara magnet dan kumparan terlalu jauh (± 8 mm) serta karet pulley sedikit selip.',
      improveWeakness: 'Jarak celah udara terlalu lebar dan kopling pulley kurang kencang sehingga putaran tidak stabil.',
      improveWhatToFix: 'Merapatkan posisi kumparan hingga 2 mm dari rotor magnet dan menambah jumlah lilitan menjadi 1000 lilitan.',
      improveNewIdeas: 'Menambahkan dudukan bearing dari tutup pulpen agar poros berputar tanpa gesekan tinggi dan merangkai 2 kumparan secara seri.',
      improvePlannedChanges: 'Merakit Versi 2 dengan kumparan ganda seri (1000 lilitan), magnet Neodymium N52, dan poros rendah gesekan.',
      improveV2Voltage: '3.4 V',
      improveV2LedStatus: 'Ya',
      creativityScores: { manyIdeas: 4, differentIdeas: 4, developToDesign: 4, improveAfterFail: 4, newSolution: 3 },
      collaborationScores: { contribute: 4, listen: 4, respect: 4, helpSolve: 4, responsible: 4 },
      bestContributionText: 'Mengusulkan penambahan sistem pulley rasio 1:4 dan membantu melilit ulang kumparan pada versi kedua.',
      futureImprovementText: 'Membuat jadwal pembagian waktu antara desain dan uji coba agar proses iterasi V2 lebih tenang.',
      lastSavedAt: new Date().toISOString(),
    }));
  };

  const resetAllData = () => {
    if (profile) {
      // Mode online: kosongkan jawaban tetapi pertahankan identitas akun (perubahan ikut tersinkron)
      setState((prev) => ({ ...INITIAL_STATE, identity: prev.identity, lastSavedAt: new Date().toISOString() }));
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    setState(INITIAL_STATE);
  };

  const completionPercent = Math.round((state.visitedScreens.length / SCREENS.length) * 100);

  return (
    <ModulContext.Provider
      value={{
        state,
        setScreen,
        nextScreen,
        prevScreen,
        updateState,
        updateIdentity,
        addIdea,
        voteIdea,
        removeIdea,
        rotateRoles,
        loadDemoData,
        resetAllData,
        completionPercent,
        syncStatus,
        signOutAndClear,
        hasLocalOnlyImages,
      }}
    >
      {children}
    </ModulContext.Provider>
  );
};

export const useModul = (): ModulContextValue => {
  const ctx = useContext(ModulContext);
  if (!ctx) {
    throw new Error('useModul harus digunakan di dalam ModulProvider');
  }
  return ctx;
};

