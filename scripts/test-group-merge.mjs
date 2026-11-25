// Uji unit aturan penggabungan data kelompok (src/lib/groupSync.ts). Tanpa jaringan.
//   node scripts/test-group-merge.mjs
import {
  flattenGroup, applyFlat, diffLocal, mergeServer, snapshotFrom, hasChanges, timeKey, isUuid,
} from '../src/lib/groupSync.ts';

const results = [];
const ok = (name, cond, detail = '') => {
  results.push(cond);
  console.log(`${cond ? 'LULUS' : 'GAGAL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

const ROLES = ['Leader', 'Engineer', 'Data Analyst', 'Experimenter', 'Communicator'];
function baseState() {
  return {
    currentScreen: 9, visitedScreens: [1], lastSavedAt: '', identity: { studentName: '', studentClass: '', groupName: '', schoolName: '' },
    checkedObjectives: [], initialHypothesis: '', guidingAnswers: {},
    fluxB: 1, fluxA: 0.2, fluxTheta: 30, fluxDefinitionAnswer: '', faradayTurns: 400, faradaySpeed: 5, faradayB: 1.2, faradayFactorAnswer: '',
    lenzPole: 'N', lenzMotion: 'approach', lenzAnswer: '',
    checkedTools: [], experimentStrategy: '', roles: ROLES.map((role) => ({ role, taskDescription: 't', memberName: '' })),
    labReportFileName: '', labReportLink: '', checkedConstraints: [],
    ideas: [{ id: 'idea-starter-1', authorName: 'Contoh', title: 'x', driveMechanism: 'Engkol Manual', description: 'x', color: 'cyan', votes: 2, createdAt: '' }],
    finalSelectedIdea: '', driveSyncRecorded: false,
    designName: '', designPhysicsPrinciple: '', designMaterials: '', designAdvantages: '', designPrediction: '', designSketchDataUrl: '', designSketchFileName: '',
    processPhotoUrl: '', processPhotoName: '', prototypePhotoUrl: '', prototypePhotoName: '', testVideoLink: '', lmsUploadLink: '',
    testingRows: [{ id: 'trial-1', trialLabel: 'Uji Coba 1', voltage: '', turns: '', speed: 'Sedang', magnetCondition: '', ledLit: 'Tidak' }],
    designSuccessStatus: '', failureCauseAnalysis: '',
    improveWeakness: '', improveWhatToFix: '', improveNewIdeas: '', improvePlannedChanges: '', improveV2Voltage: '', improveV2LedStatus: '', improveDriveLink: '',
    presentationPoints: { masalah: '', ideAwal: '', konsepFisika: '', desain: '', prototype: '', dataPengujian: '', kegagalan: '', perbaikan: '', hasilAkhir: '' },
    presentationSlideLink: '', googleFormUrl: '',
    creativityScores: { manyIdeas: 0, differentIdeas: 0, developToDesign: 0, improveAfterFail: 0, newSolution: 0 },
    collaborationScores: { contribute: 0, listen: 0, respect: 0, helpSolve: 0, responsible: 0 },
    bestContributionText: '', futureImprovementText: '',
  };
}

const T1 = '11111111-1111-4111-8111-111111111111';
const T2 = '22222222-2222-4222-8222-222222222222';
const I1 = '33333333-3333-4333-8333-333333333333';
const ME = '44444444-4444-4444-8444-444444444444';
const FRIEND = '55555555-5555-4555-8555-555555555555';

function bundle(over = {}) {
  return {
    data: {}, dataMeta: {},
    roles: ROLES.map((role) => ({ role, member_name: '', task_description: 't', updated_at: '2026-01-01T00:00:00Z' })),
    trials: [{ id: T1, sort_order: 0, trial_label: 'Uji Coba 1', voltage: '', turns: '', speed: 'Sedang', magnet_condition: '', led_lit: 'Tidak', updated_at: '2026-01-01T00:00:00Z' }],
    ideas: [],
    ...over,
  };
}

// --- dasar
{
  const s = baseState();
  s.presentationPoints.masalah = 'M';
  const f = flattenGroup(s);
  ok('Isi presentasi dipecah per poin', f['presentationPoints.masalah'] === 'M' && !('presentationPoints' in f));
  const back = applyFlat(baseState(), { 'presentationPoints.desain': 'D', experimentStrategy: 'E', bukanKunci: 'x' });
  ok('applyFlat memasang kunci kelompok saja', back.presentationPoints.desain === 'D' && back.experimentStrategy === 'E' && !('bukanKunci' in back));
}

// --- muat pertama (tanpa snapshot)
{
  const s = baseState();
  s.experimentStrategy = 'dari data lama (D26)';
  s.finalSelectedIdea = 'lokal';
  const b = bundle({ data: { finalSelectedIdea: 'dari teman' }, ideas: [{ id: I1, author_id: FRIEND, author_name: 'Teman', title: 'Ide teman', drive_mechanism: 'Kincir Air', description: 'd', color: 'amber', created_at: '2026-01-02T00:00:00Z', idea_votes: [{ voter_id: ME }, { voter_id: FRIEND }] }] });
  const m = mergeServer({ state: s, bundle: b, snap: null, times: {}, me: ME });
  ok('Muat pertama: isian lama yang belum ada di server dipertahankan (untuk dikirim)', m.experimentStrategy === 'dari data lama (D26)');
  ok('Muat pertama: isian yang sudah diisi teman di server dipakai', m.finalSelectedIdea === 'dari teman');
  ok('Muat pertama: contoh ide bawaan dibuang, ide server dipakai', m.ideas.length === 1 && m.ideas[0].id === I1);
  ok('Jumlah vote dan "sudah vote" dihitung dari server', m.ideas[0].votes === 2 && m.ideas[0].votedByMe === true);
  ok('Muat pertama: baris uji kosong bawaan diganti baris server', m.testingRows.length === 1 && m.testingRows[0].id === T1);
  const snap = snapshotFrom(b);
  const ch = diffLocal(m, snap);
  ok('Setelah muat pertama hanya isian lama yang akan dikirim', ch.keys.length === 1 && ch.keys[0] === 'experimentStrategy', ch.keys.join(','));
}
{
  const s = baseState();
  s.testingRows = [{ id: 't1', trialLabel: 'Uji lama', voltage: '1.1 V', turns: '300', speed: 'Sedang', magnetCondition: 'x', ledLit: 'Ya' }];
  const m = mergeServer({ state: s, bundle: bundle(), snap: null, times: {}, me: ME });
  const lama = m.testingRows.find((r) => r.trialLabel === 'Uji lama');
  ok('Muat pertama: baris uji lama berisi data dipertahankan dengan id UUID baru', Boolean(lama) && isUuid(lama.id) && m.testingRows.length === 2);
}

// --- kunci teks: teman vs lokal
function setup() {
  const b = bundle({ data: { experimentStrategy: 'awal', finalSelectedIdea: 'awal' }, dataMeta: { experimentStrategy: '2026-01-01T10:00:00Z', finalSelectedIdea: '2026-01-01T10:00:00Z' } });
  const snap = snapshotFrom(b);
  const s = applyFlat(baseState(), b.data);
  s.testingRows = [{ id: T1, trialLabel: 'Uji Coba 1', voltage: '', turns: '', speed: 'Sedang', magnetCondition: '', ledLit: 'Tidak' }];
  return { b, snap, s };
}
{
  const { snap, s } = setup();
  s.experimentStrategy = 'ketikan saya';
  const b2 = bundle({ data: { experimentStrategy: 'awal', finalSelectedIdea: 'ubahan teman' }, dataMeta: { experimentStrategy: '2026-01-01T10:00:00Z', finalSelectedIdea: '2026-01-01T10:05:00Z' } });
  const m = mergeServer({ state: s, bundle: b2, snap, times: { [timeKey.key('experimentStrategy')]: '2026-01-01T10:04:00Z' }, me: ME });
  ok('Edit di kolom berbeda tidak saling menimpa', m.experimentStrategy === 'ketikan saya' && m.finalSelectedIdea === 'ubahan teman');
}
{
  const { snap, s } = setup();
  s.experimentStrategy = 'ketikan terbaru';
  snap.flat.experimentStrategy = 'ketikan lama'; // kita sudah mengirim 'ketikan lama'
  const b2 = bundle({ data: { experimentStrategy: 'ketikan lama' }, dataMeta: { experimentStrategy: '2030-01-01T00:00:00Z' } });
  const m = mergeServer({ state: s, bundle: b2, snap, times: { [timeKey.key('experimentStrategy')]: '2020-01-01T00:00:00Z' }, me: ME });
  ok('Gema kiriman sendiri tidak menimpa ketikan terbaru (meski jam perangkat salah)', m.experimentStrategy === 'ketikan terbaru');
}
{
  const { snap, s } = setup();
  s.experimentStrategy = 'saya (offline)';
  const b2 = bundle({ data: { experimentStrategy: 'teman lebih baru' }, dataMeta: { experimentStrategy: '2026-01-01T12:00:00Z' } });
  const m = mergeServer({ state: s, bundle: b2, snap, times: { [timeKey.key('experimentStrategy')]: '2026-01-01T11:00:00Z' }, me: ME });
  ok('Konflik kolom yang sama: perubahan teman yang lebih baru menang', m.experimentStrategy === 'teman lebih baru');
  const m2 = mergeServer({ state: s, bundle: b2, snap, times: { [timeKey.key('experimentStrategy')]: '2026-01-01T13:00:00Z' }, me: ME });
  ok('Konflik kolom yang sama: perubahan saya yang lebih baru menang', m2.experimentStrategy === 'saya (offline)');
  const lost = {};
  mergeServer({ state: s, bundle: b2, snap, times: { [timeKey.key('experimentStrategy')]: '2026-01-01T11:00:00Z' }, me: ME, lost });
  ok('Versi saya yang kalah dicatat untuk cadangan', lost[timeKey.key('experimentStrategy')] === 'saya (offline)', JSON.stringify(lost));
  const lost2 = {};
  mergeServer({ state: s, bundle: b2, snap, times: { [timeKey.key('experimentStrategy')]: '2026-01-01T13:00:00Z' }, me: ME, lost: lost2 });
  ok('Bila saya menang, tidak ada yang dicadangkan', Object.keys(lost2).length === 0);
}

// --- baris uji dan peran
{
  const { b, snap, s } = setup();
  s.testingRows = [...s.testingRows, { id: T2, trialLabel: 'Baru', voltage: '2 V', turns: '', speed: 'Cepat', magnetCondition: '', ledLit: 'Ya' }];
  const ch = diffLocal(s, snap);
  ok('Baris uji baru terdeteksi sebagai sisipan', ch.trialInserts.length === 1 && ch.trialInserts[0].row.id === T2);
  const m = mergeServer({ state: s, bundle: b, snap, times: {}, me: ME });
  ok('Baris uji baru yang belum terkirim tidak hilang saat data server masuk', m.testingRows.some((r) => r.id === T2));
  const m2 = mergeServer({ state: m, bundle: bundle({ data: b.data, trials: [] }), snap, times: {}, me: ME });
  ok('Baris yang dihapus teman ikut hilang', !m2.testingRows.some((r) => r.id === T1));
}
{
  const { b, snap, s } = setup();
  s.testingRows = [];
  const ch = diffLocal(s, snap);
  ok('Hapus baris lokal terdeteksi', ch.trialDeletes.includes(T1));
  const m = mergeServer({ state: s, bundle: b, snap, times: {}, me: ME });
  ok('Hapus lokal yang tertunda tidak dibatalkan oleh data server', !m.testingRows.some((r) => r.id === T1));
}
{
  const { b, snap, s } = setup();
  s.roles = s.roles.map((r) => (r.role === 'Leader' ? { ...r, memberName: 'Saya' } : r));
  const b2 = { ...b, roles: b.roles.map((r) => (r.role === 'Engineer' ? { ...r, member_name: 'Teman', updated_at: '2026-01-02T00:00:00Z' } : r)) };
  const m = mergeServer({ state: s, bundle: b2, snap, times: {}, me: ME });
  const by = Object.fromEntries(m.roles.map((r) => [r.role, r.memberName]));
  ok('Peran berbeda diisi dua anggota: keduanya tersimpan', by.Leader === 'Saya' && by.Engineer === 'Teman');
}

// --- ide
{
  const { b, snap, s } = setup();
  const mine = { id: crypto.randomUUID(), authorName: 'Saya', title: 'Ide saya', driveMechanism: 'Engkol Manual', description: 'd', color: 'cyan', votes: 0, createdAt: '', authorId: ME, votedByMe: false };
  s.ideas = [mine];
  const m = mergeServer({ state: s, bundle: b, snap, times: {}, me: ME });
  ok('Ide baru yang belum terkirim tetap tampil', m.ideas.some((i) => i.id === mine.id));
  ok('Ide baru terdeteksi sebagai sisipan sebelum terkirim', diffLocal(s, snap).ideaInserts.length === 1);
  ok('Tidak ada perubahan tersisa setelah ide tercatat di snapshot', !hasChanges(diffLocal(s, { ...snap, ideaIds: [mine.id] })));
}

const failed = results.filter((r) => !r).length;
console.log(`\nHasil: ${results.length - failed}/${results.length} lulus.`);
process.exit(failed ? 1 : 0);
