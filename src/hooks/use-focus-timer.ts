import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { getLastLockAt } from '../../modules/lock-state';
import { ThemeId } from '@/constants/themes';
import { appendSession } from '@/lib/session-log';

export type TimerStatus = 'idle' | 'running' | 'done' | 'doused';

interface StoredStats {
  streak: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
  todayDate: string;
  todayCount: number;
}

const STORAGE_KEY = 'ember.stats.v1';
/** Returning to the app within this window is forgiven (mis-taps, quick checks). */
const AWAY_GRACE_MS = 10_000;
/** A device lock registered this close to backgrounding means "locked", not "left". */
const LOCK_BEFORE_SLACK_MS = 5_000;
const LOCK_AFTER_SLACK_MS = 8_000;

function dateKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

function emptyStats(): StoredStats {
  return { streak: 0, lastCompletedDate: null, todayDate: dateKey(), todayCount: 0 };
}

/** Roll stored stats forward to today: reset the daily count on a new day,
 *  and zero the streak if the last completed session is older than yesterday. */
function normalize(stats: StoredStats): StoredStats {
  const today = dateKey();
  const next = { ...stats };
  if (next.todayDate !== today) {
    next.todayDate = today;
    next.todayCount = 0;
  }
  if (next.lastCompletedDate !== today && next.lastCompletedDate !== yesterdayKey()) {
    next.streak = 0;
  }
  return next;
}

export function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function useFocusTimer(themeId: ThemeId) {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [durationMin, setDurationMin] = useState(25);
  const [remainingMs, setRemainingMs] = useState(25 * 60_000);
  const [stats, setStats] = useState<StoredStats>(emptyStats);

  const themeIdRef = useRef(themeId);
  useEffect(() => {
    themeIdRef.current = themeId;
  }, [themeId]);

  const endAtRef = useRef(0);
  const startedDurationMinRef = useRef(25);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backgroundedAtRef = useRef<number | null>(null);
  const statusRef = useRef<TimerStatus>('idle');

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setStats(normalize(JSON.parse(raw) as StoredStats));
      })
      .catch(() => {});
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const clearTicker = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const recordCompletedSession = useCallback(() => {
    appendSession({
      endedAt: Date.now(),
      durationMin: startedDurationMinRef.current,
      themeId: themeIdRef.current,
      outcome: 'completed',
    });
    setStats((prev) => {
      const today = dateKey();
      const base = normalize(prev);
      const next: StoredStats = {
        todayDate: today,
        todayCount: base.todayCount + 1,
        lastCompletedDate: today,
        streak:
          base.lastCompletedDate === today
            ? base.streak
            : base.lastCompletedDate === yesterdayKey()
              ? base.streak + 1
              : 1,
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const start = useCallback(
    (minutes?: number) => {
      const min = minutes ?? durationMin;
      clearTicker();
      startedDurationMinRef.current = min;
      endAtRef.current = Date.now() + min * 60_000;
      setDurationMin(min);
      setRemainingMs(min * 60_000);
      setStatus('running');
      intervalRef.current = setInterval(() => {
        const rem = endAtRef.current - Date.now();
        if (rem <= 0) {
          clearTicker();
          setRemainingMs(0);
          setStatus('done');
          recordCompletedSession();
        } else {
          setRemainingMs(rem);
        }
      }, 200);
    },
    [durationMin, recordCompletedSession],
  );

  // Doused is a resting state — the user taps "Go back" (dismissDone) to move on.
  const douse = useCallback((frozenRemainingMs?: number) => {
    clearTicker();
    if (frozenRemainingMs != null) setRemainingMs(Math.max(0, frozenRemainingMs));
    setStatus('doused');
    appendSession({
      endedAt: Date.now(),
      durationMin: startedDurationMinRef.current,
      themeId: themeIdRef.current,
      outcome: 'doused',
    });
  }, []);

  const giveUp = useCallback(() => douse(), [douse]);

  // Forest-style focus guard (iOS): switching to another app kills a running
  // flame; locking the phone is safe. Both look like "background" to JS, so a
  // lock registered by the native LockState module near the backgrounding
  // moment marks the absence as a lock. Decided on return because JS is
  // suspended while backgrounded.
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        if (statusRef.current === 'running') backgroundedAtRef.current = Date.now();
        return;
      }
      if (next !== 'active') return;
      const bgAt = backgroundedAtRef.current;
      backgroundedAtRef.current = null;
      if (bgAt == null || statusRef.current !== 'running') return;
      const lockAt = getLastLockAt();
      const wasLock = lockAt >= bgAt - LOCK_BEFORE_SLACK_MS && lockAt <= bgAt + LOCK_AFTER_SLACK_MS;
      const briefEnough = Date.now() - bgAt <= AWAY_GRACE_MS;
      if (wasLock || briefEnough) return; // forgiven — the ticker catches up on its own
      douse(endAtRef.current - bgAt); // he went out at the moment they left
    });
    return () => sub.remove();
  }, [douse]);

  const dismissDone = useCallback(() => {
    setStatus('idle');
    setRemainingMs(durationMin * 60_000);
  }, [durationMin]);

  const selectDuration = useCallback(
    (minutes: number) => {
      if (status !== 'idle') return;
      setDurationMin(minutes);
      setRemainingMs(minutes * 60_000);
    },
    [status],
  );

  const totalMs = durationMin * 60_000;
  const progress =
    status === 'running' || status === 'doused'
      ? Math.min(1, Math.max(0, 1 - remainingMs / totalMs))
      : status === 'done'
        ? 1
        : 0;

  return {
    status,
    remainingMs,
    durationMin,
    progress,
    streak: stats.streak,
    todayCount: stats.todayCount,
    start,
    giveUp,
    dismissDone,
    selectDuration,
  };
}
