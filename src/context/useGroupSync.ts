// Sinkron data kelompok (Fase 3): muat, Realtime (cadangan polling 10 detik), kirim perubahan per kunci/baris.

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { EModulState } from '../types/emodul';
import { studentClient } from '../lib/supabase';
import {
  diffLocal, flattenGroup, hasChanges, ideaToRow, mergeServer, readGroupStore, resetGroupFields, same, saveGroupBackup, snapshotFrom, timeKey,
  trialToRow, writeGroupStore, type ChangeTimes, type ServerBundle, type ServerIdea, type ServerRole,
  type ServerTrial, type Snapshot,
} from '../lib/groupSync';

export type GroupStatus = 'off' | 'syncing' | 'saving' | 'saved' | 'offline' | 'error';

const PUSH_DEBOUNCE_MS = 1200;
const POLL_MS = 10_000;
const MAX_RETRY_MS = 60_000;

interface Args {
  enabled: boolean;
  userId: string | null;
  groupId: string | null;
  state: EModulState;
  setState: Dispatch<SetStateAction<EModulState>>;
  initialState: EModulState;
}

export function useGroupSync({ enabled, userId, groupId, state, setState, initialState }: Args) {
  const [status, setStatus] = useState<GroupStatus>('off');
  const [live, setLive] = useState(false);
  /** Kunci `userId:groupId` yang muat awalnya sudah selesai (dipakai antrean unggah Fase 4). */
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const liveRef = useRef(false);

  const stateRef = useRef(state);
  stateRef.current = state;
  const snapRef = useRef<Snapshot | null>(null);
  const timesRef = useRef<ChangeTimes>({});
  const prevRef = useRef<EModulState | null>(null);
  const readyRef = useRef<string | null>(null); // `${userId}:${groupId}` setelah muat awal
  const pushTimer = useRef<number | null>(null);
  const fetchTimer = useRef<number | null>(null);
  const inFlight = useRef(false);
  const again = useRef(false);
  const retryDelay = useRef(2000);
  const skipIds = useRef(new Set<string>()); // baris yang ditolak server secara permanen

  const key = enabled && userId && groupId ? `${userId}:${groupId}` : null;

  const persist = useCallback(() => {
    if (userId && groupId && snapRef.current) writeGroupStore(userId, groupId, snapRef.current, timesRef.current);
  }, [userId, groupId]);

  const fetchBundle = useCallback(async (): Promise<ServerBundle | null> => {
    const c = studentClient;
    if (!c || !groupId) return null;
    const [gs, roles, trials, ideas] = await Promise.all([
      c.from('group_state').select('data, data_meta').eq('group_id', groupId).maybeSingle(),
      c.from('group_roles').select('role, member_name, task_description, updated_at').eq('group_id', groupId),
      c.from('test_trials').select('id, sort_order, trial_label, voltage, turns, speed, magnet_condition, led_lit, updated_at')
        .eq('group_id', groupId).order('sort_order').order('updated_at'),
      c.from('ideas').select('id, author_id, author_name, title, drive_mechanism, description, color, created_at, idea_votes(voter_id)')
        .eq('group_id', groupId).order('created_at', { ascending: false }),
    ]);
    if (gs.error || roles.error || trials.error || ideas.error) return null;
    return {
      data: (gs.data?.data as Record<string, unknown>) ?? {},
      dataMeta: (gs.data?.data_meta as Record<string, string>) ?? {},
      roles: (roles.data ?? []) as ServerRole[],
      trials: (trials.data ?? []) as ServerTrial[],
      ideas: (ideas.data ?? []) as unknown as ServerIdea[],
    };
  }, [groupId]);

  // ---------------------------------------------------------------- kirim perubahan lokal
  const flush = useCallback(async () => {
    const c = studentClient;
    const snap = snapRef.current;
    if (!c || !groupId || !userId || !snap || !readyRef.current) return;
    if (inFlight.current) {
      again.current = true;
      return;
    }
    inFlight.current = true;
    setStatus('saving');
    const s = stateRef.current;
    const ch = diffLocal(s, snap);
    try {
      if (ch.keys.length) {
        const flat = flattenGroup(s);
        const patch = Object.fromEntries(ch.keys.map((k) => [k, flat[k]]));
        const { error } = await c.rpc('patch_group_state', { p_group: groupId, p_patch: patch });
        if (error) throw error;
        Object.assign(snap.flat, patch);
      }
      for (const role of ch.roles) {
        const r = s.roles.find((x) => x.role === role)!;
        const { error } = await c.from('group_roles')
          .update({ member_name: r.memberName.slice(0, 100), task_description: r.taskDescription.slice(0, 300) })
          .eq('group_id', groupId).eq('role', role);
        if (error) throw error;
        snap.roles[role] = { memberName: r.memberName, taskDescription: r.taskDescription };
      }
      for (const { row, sortOrder } of ch.trialInserts) {
        if (skipIds.current.has(row.id)) continue;
        const { error } = await c.from('test_trials').insert({ id: row.id, group_id: groupId, ...trialToRow(row, sortOrder) });
        if (error && error.code !== '23505') {
          if (error.code === '23514' || error.code === '22P02') { skipIds.current.add(row.id); continue; }
          throw error;
        }
        snap.trials[row.id] = { row: { ...row }, sortOrder };
      }
      for (const { row, sortOrder } of ch.trialUpdates) {
        const { error } = await c.from('test_trials').update(trialToRow(row, sortOrder)).eq('id', row.id);
        if (error) throw error;
        snap.trials[row.id] = { row: { ...row }, sortOrder };
      }
      for (const id of ch.trialDeletes) {
        const { error } = await c.from('test_trials').delete().eq('id', id);
        if (error) throw error;
        delete snap.trials[id];
      }
      for (const idea of ch.ideaInserts) {
        if (skipIds.current.has(idea.id)) continue;
        const { error } = await c.from('ideas').insert(ideaToRow(idea, groupId, userId));
        if (error && error.code !== '23505') {
          if (error.code === '23514' || error.code === '22P02') { skipIds.current.add(idea.id); continue; }
          throw error;
        }
        snap.ideaIds.push(idea.id);
      }
      for (const id of ch.ideaDeletes) {
        const { error } = await c.from('ideas').delete().eq('id', id);
        if (error) throw error;
        // Bila RLS menolak (ide milik teman), baris tetap ada di server dan muncul lagi saat dimuat ulang
        snap.ideaIds = snap.ideaIds.filter((x) => x !== id);
      }
      persist();
      retryDelay.current = 2000;
      setStatus(hasChanges(diffLocal(stateRef.current, snap)) ? 'saving' : 'saved');
      if (ch.ideaDeletes.length) scheduleFetchRef.current(500);
    } catch (err) {
      console.warn('Sinkron kelompok gagal, dicoba lagi:', (err as Error)?.message);
      persist();
      setStatus(navigator.onLine ? 'error' : 'offline');
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
      pushTimer.current = window.setTimeout(() => void flush(), retryDelay.current);
      retryDelay.current = Math.min(MAX_RETRY_MS, retryDelay.current * 2);
    } finally {
      inFlight.current = false;
      if (again.current) {
        again.current = false;
        if (pushTimer.current) window.clearTimeout(pushTimer.current);
        pushTimer.current = window.setTimeout(() => void flush(), 300);
      }
    }
  }, [groupId, userId, persist]);

  // ---------------------------------------------------------------- terapkan data server
  const applyServer = useCallback(async () => {
    const bundle = await fetchBundle();
    if (!bundle) {
      if (!readyRef.current) setStatus(navigator.onLine ? 'error' : 'offline');
      return false;
    }
    const snap = snapRef.current;
    const times = timesRef.current;
    const me = userId;
    snapRef.current = snapshotFrom(bundle);
    // Catat perubahan lokal yang kalah dari teman (cadangan 7 hari). Dihitung di luar updater agar tidak
    // menjadi efek samping di dalam setState (updater bisa dipanggil dua kali di StrictMode).
    const lost: Record<string, unknown> = {};
    mergeServer({ state: stateRef.current, bundle, snap, times, me, lost });
    if (me && groupId) saveGroupBackup(me, groupId, lost);
    setState((prev) => mergeServer({ state: prev, bundle, snap, times, me }));
    persist();
    return true;
  }, [fetchBundle, setState, persist, userId, groupId]);

  const scheduleFetchRef = useRef<(delay?: number) => void>(() => {});
  scheduleFetchRef.current = (delay = 400) => {
    if (fetchTimer.current) window.clearTimeout(fetchTimer.current);
    fetchTimer.current = window.setTimeout(() => {
      if (inFlight.current) {
        scheduleFetchRef.current(800);
        return;
      }
      void applyServer();
    }, delay);
  };

  // ---------------------------------------------------------------- muat awal + Realtime + polling
  useEffect(() => {
    const c = studentClient;
    if (!key || !c || !userId || !groupId) {
      readyRef.current = null;
      setReadyKey(null);
      setStatus('off');
      setLive(false);
      return;
    }
    let cancelled = false;
    setStatus('syncing');
    const stored = readGroupStore(userId, groupId);
    snapRef.current = stored.snap;
    timesRef.current = stored.times;
    if (stored.foreign) setState((prev) => resetGroupFields(prev, initialState));

    (async () => {
      const ok = await applyServer();
      if (cancelled || !ok) return;
      readyRef.current = key;
      setReadyKey(key);
      prevRef.current = null;
      // perubahan lokal yang tertunda (mis. dari offline / data lama) langsung dikirim
      pushTimer.current = window.setTimeout(() => void flush(), 50);
    })();

    const refetch = () => scheduleFetchRef.current();
    const channel = c
      .channel(`group-${groupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_state', filter: `group_id=eq.${groupId}` }, refetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_roles', filter: `group_id=eq.${groupId}` }, refetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'test_trials', filter: `group_id=eq.${groupId}` }, refetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas', filter: `group_id=eq.${groupId}` }, refetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'idea_votes' }, refetch)
      .subscribe((s) => {
        if (cancelled) return;
        liveRef.current = s === 'SUBSCRIBED';
        setLive(liveRef.current);
        if (liveRef.current) scheduleFetchRef.current(0); // ambil perubahan yang terlewat saat tersambung ulang
      });

    const poll = window.setInterval(() => {
      if (!readyRef.current) {
        void applyServer().then((ok) => {
          if (ok && !cancelled) {
            readyRef.current = key;
            setReadyKey(key);
          }
        });
        return;
      }
      if (!liveRef.current) scheduleFetchRef.current(0);
    }, POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && scheduleFetchRef.current(0);
    const onOnline = () => {
      scheduleFetchRef.current(0);
      pushTimer.current = window.setTimeout(() => void flush(), 500);
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);

    return () => {
      cancelled = true;
      readyRef.current = null;
      setReadyKey(null);
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
      if (fetchTimer.current) window.clearTimeout(fetchTimer.current);
      void c.removeChannel(channel);
    };
  }, [key, userId, groupId, applyServer, flush, setState, initialState]);

  // ---------------------------------------------------------------- catat perubahan lokal lalu jadwalkan kirim
  useEffect(() => {
    const snap = snapRef.current;
    if (!readyRef.current || readyRef.current !== key || !snap) return;
    const prev = prevRef.current;
    prevRef.current = state;
    const ch = diffLocal(state, snap);
    if (!hasChanges(ch)) {
      setStatus((s) => (s === 'saving' && !inFlight.current ? 'saved' : s));
      return;
    }
    // Catat waktu hanya untuk item yang benar-benar berubah sejak render sebelumnya
    const now = new Date().toISOString();
    const t = timesRef.current;
    if (prev) {
      const a = flattenGroup(prev), b = flattenGroup(state);
      for (const k of ch.keys) if (!same(a[k], b[k])) t[timeKey.key(k)] = now;
      for (const role of ch.roles) {
        if (!same(prev.roles.find((r) => r.role === role), state.roles.find((r) => r.role === role))) t[timeKey.role(role)] = now;
      }
      for (const { row } of [...ch.trialUpdates, ...ch.trialInserts]) {
        if (!same(prev.testingRows.find((r) => r.id === row.id), row)) t[timeKey.trial(row.id)] = now;
      }
    }
    if (pushTimer.current) window.clearTimeout(pushTimer.current);
    pushTimer.current = window.setTimeout(() => void flush(), PUSH_DEBOUNCE_MS);
    setStatus('saving');
  }, [state, key, flush]);

  /** Beri / tarik vote (satu siswa satu vote per ide). */
  const toggleVote = useCallback(async (ideaId: string) => {
    const c = studentClient;
    if (!c || !userId) return;
    const idea = stateRef.current.ideas.find((i) => i.id === ideaId);
    if (!idea) return;
    const voted = Boolean(idea.votedByMe);
    setState((p) => ({
      ...p,
      ideas: p.ideas.map((i) => (i.id === ideaId ? { ...i, votedByMe: !voted, votes: Math.max(0, i.votes + (voted ? -1 : 1)) } : i)),
    }));
    const { error } = voted
      ? await c.from('idea_votes').delete().eq('idea_id', ideaId).eq('voter_id', userId)
      : await c.from('idea_votes').insert({ idea_id: ideaId, voter_id: userId });
    if (error && error.code !== '23505') {
      console.warn('Vote gagal:', error.message);
      scheduleFetchRef.current(0);
    }
  }, [setState, userId]);

  return { status, live, toggleVote, ready: Boolean(key) && readyKey === key };
}
