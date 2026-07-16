import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemeId } from '@/constants/themes';

export interface SessionRecord {
  endedAt: number;
  durationMin: number;
  themeId: ThemeId;
  outcome: 'completed' | 'doused';
}

const KEY = 'ember.sessions.v1';

export async function loadSessions(): Promise<SessionRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionRecord[]) : [];
  } catch {
    return [];
  }
}

export function appendSession(record: SessionRecord): void {
  loadSessions()
    .then((all) => AsyncStorage.setItem(KEY, JSON.stringify([...all, record])))
    .catch(() => {});
}

export type CandleTier = 'tealight' | 'votive' | 'standard' | 'pillar' | 'grand';

/** Longer sessions earn bigger candles for the collection. */
export function tierForMinutes(min: number): CandleTier {
  if (min < 10) return 'tealight';
  if (min < 25) return 'votive';
  if (min < 45) return 'standard';
  if (min < 90) return 'pillar';
  return 'grand';
}
