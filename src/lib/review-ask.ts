import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { loadSessions } from '@/lib/session-log';

type StoreReviewModule = typeof import('expo-store-review');

let StoreReview: StoreReviewModule | null = null;
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  StoreReview = require('expo-store-review');
}

const KEY = 'ember.reviewAsk.v1';

/** Completed-session counts that earn a rating ask. iOS ignores requests past
 *  3 per 365 days per device, so these are ceilings, not guarantees. */
const MILESTONES = [3, 15, 40];

/** Let the chime and the candle reveal land before the system sheet appears. */
const ASK_DELAY_MS = 2800;

interface AskState {
  askedMilestones: number[];
}

async function loadState(): Promise<AskState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as AskState) : null;
    return { askedMilestones: parsed?.askedMilestones ?? [] };
  } catch {
    return { askedMilestones: [] };
  }
}

/** Ask for an App Store rating on milestone session completions. Fire-and-forget
 *  from the completion path; resolves quietly on every non-asking outcome. */
export function maybeAskForReview(): void {
  const sr = StoreReview;
  if (!sr) return;
  setTimeout(async () => {
    try {
      const sessions = await loadSessions();
      const completed = sessions.filter((s) => s.outcome === 'completed').length;
      if (!MILESTONES.includes(completed)) return;
      const state = await loadState();
      if (state.askedMilestones.includes(completed)) return;
      // Persist before asking so an interrupted ask can never repeat.
      await AsyncStorage.setItem(
        KEY,
        JSON.stringify({
          askedMilestones: [...state.askedMilestones, completed],
        } satisfies AskState),
      );
      if (await sr.isAvailableAsync()) await sr.requestReview();
    } catch {
      // Never let a rating ask surface as an error.
    }
  }, ASK_DELAY_MS);
}
