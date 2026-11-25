export type NavPillar =
  | 'home'
  | 'materi'
  | 'eksperimen'
  | 'tantangan'
  | 'kolaborasi'
  | 'evaluasi'
  | 'refleksi';

export type TeamRoleKey =
  | 'Leader'
  | 'Engineer'
  | 'Data Analyst'
  | 'Experimenter'
  | 'Communicator';

export interface ScreenMeta {
  id: number;
  code: string;
  title: string;
  shortTitle: string;
  pillar: NavPillar;
  phase: 'Orientasi' | 'Konsep & Simulasi' | 'Eksperimen Lab' | 'STEM EDP' | 'Evaluasi & Refleksi';
}

/** Berkas kelompok di Supabase Storage (Fase 4). Disimpan di group_state, isi berkas di bucket privat. */
export interface FileRef {
  path: string;
  name: string;
  size: number;
  uploadedAt: string;
}

export interface StudentIdentity {
  studentName: string;
  studentClass: string;
  groupName: string;
  schoolName: string;
}

export interface IdeaNote {
  id: string;
  authorName: string;
  title: string;
  driveMechanism: 'Engkol Manual' | 'Kincir Angin' | 'Kincir Air' | 'Gravitasi / Beban' | 'Lainnya';
  description: string;
  color: 'cyan' | 'amber' | 'emerald' | 'indigo';
  votes: number;
  createdAt: string;
  /** Id siswa pembuat (mode online). */
  authorId?: string | null;
  /** Siswa yang sedang masuk sudah memberi vote (mode online). */
  votedByMe?: boolean;
}

export interface TestingRow {
  id: string;
  trialLabel: string;
  voltage: string;
  turns: string;
  speed: 'Lambat' | 'Sedang' | 'Cepat' | string;
  magnetCondition: string;
  ledLit: 'Ya' | 'Tidak';
}

export interface RoleAssignment {
  role: TeamRoleKey;
  taskDescription: string;
  memberName: string;
}

export interface CreativityScores {
  manyIdeas: number;
  differentIdeas: number;
  developToDesign: number;
  improveAfterFail: number;
  newSolution: number;
}

export interface CollaborationScores {
  contribute: number;
  listen: number;
  respect: number;
  helpSolve: number;
  responsible: number;
}

export interface EModulState {
  currentScreen: number;
  visitedScreens: number[];
  lastSavedAt: string;

  // Screen 1: Cover & Identitas
  identity: StudentIdentity;

  // Screen 4: Checklist Tujuan Pembelajaran
  checkedObjectives: number[];

  // Screen 5: Pemantik & Hipotesis Awal
  initialHypothesis: string;
  guidingAnswers: Record<number, string>;

  // Screen 6: Fluks Magnetik
  fluxB: number;
  fluxA: number;
  fluxTheta: number;
  fluxDefinitionAnswer: string;

  // Screen 7: Hukum Faraday
  faradayTurns: number;
  faradaySpeed: number;
  faradayB: number;
  faradayFactorAnswer: string;

  // Screen 8: Hukum Lenz
  lenzPole: 'N' | 'S';
  lenzMotion: 'approach' | 'recede';
  lenzAnswer: string;

  // Screen 9: Eksperimen Learning Kit
  checkedTools: string[];
  experimentStrategy: string;
  roles: RoleAssignment[];
  labReportFileName: string;
  labReportLink: string;
  labReportFile: FileRef | null;

  // Screen 10: Tantangan STEM
  checkedConstraints: string[];

  // Screen 11: Brainstorming
  ideas: IdeaNote[];
  finalSelectedIdea: string;
  driveSyncRecorded: boolean;

  // Screen 12: Sketsa Desain
  designName: string;
  designPhysicsPrinciple: string;
  designMaterials: string;
  designAdvantages: string;
  designPrediction: string;
  designSketchDataUrl: string;
  designSketchFileName: string;
  designSketchFile: FileRef | null;

  // Screen 13: Membuat Prototipe
  processPhotoUrl: string;
  processPhotoName: string;
  prototypePhotoUrl: string;
  prototypePhotoName: string;
  processPhotoFile: FileRef | null;
  prototypePhotoFile: FileRef | null;
  testVideoLink: string;
  lmsUploadLink: string;

  // Screen 14: Testing
  testingRows: TestingRow[];
  designSuccessStatus: 'Ya' | 'Sebagian' | 'Belum' | '';
  failureCauseAnalysis: string;

  // Screen 15: Improve
  improveWeakness: string;
  improveWhatToFix: string;
  improveNewIdeas: string;
  improvePlannedChanges: string;
  improveV2Voltage: string;
  improveV2LedStatus: 'Ya' | 'Tidak' | '';
  improveDriveLink: string;

  // Screen 16: Presentasi Kelompok
  presentationPoints: {
    masalah: string;
    ideAwal: string;
    konsepFisika: string;
    desain: string;
    prototype: string;
    dataPengujian: string;
    kegagalan: string;
    perbaikan: string;
    hasilAkhir: string;
  };
  presentationSlideLink: string;

  // Screen 17: Refleksi
  googleFormUrl: string;
  creativityScores: CreativityScores;
  collaborationScores: CollaborationScores;
  bestContributionText: string;
  futureImprovementText: string;
}

