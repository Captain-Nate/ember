import { AppState, Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

let Notifications: NotificationsModule | null = null;
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
}

/** Suppress the banner when the app is foregrounded — the in-app celebration covers it. */
export function initSessionAlerts(): void {
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: AppState.currentState !== 'active',
      shouldShowList: true,
      shouldPlaySound: AppState.currentState !== 'active',
      shouldSetBadge: false,
    }),
  });
}

export async function ensureAlertPermission(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

export async function scheduleSessionComplete(endAtMs: number): Promise<string | null> {
  if (!Notifications) return null;
  try {
    if (!(await ensureAlertPermission())) return null;
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Session complete',
        body: 'Ember has lit a new candle for your collection.',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(endAtMs),
      },
    });
  } catch {
    return null;
  }
}

export function cancelSessionAlert(id: string | null): void {
  if (!Notifications || !id) return;
  Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}
