import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

import { THEMES, ThemeId } from '@/constants/themes';

const KEY = 'ember.entitlements.v1';

export const FREE_THEME: ThemeId = 'ember';
export const THEME_PRICE_LABEL = '$0.99';
export const BUNDLE_PRICE_LABEL = '$2.99';

/**
 * Dev switch (à la 1MS TESTING_ADS): true = every theme unlocked, no shop friction.
 * Phase 2 replaces the stubbed unlocks below with react-native-iap purchases;
 * planned product ids: com.captainnate.ember.theme.<id> and .themes.all.
 */
export const DEV_UNLOCK_ALL = false;

interface Entitlements {
  ownedThemes: ThemeId[];
}

export async function loadOwnedThemes(): Promise<ThemeId[]> {
  if (DEV_UNLOCK_ALL) return Object.keys(THEMES) as ThemeId[];
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Entitlements) : null;
    const owned = new Set<ThemeId>(parsed?.ownedThemes ?? []);
    owned.add(FREE_THEME);
    return [...owned].filter((id) => id in THEMES);
  } catch {
    return [FREE_THEME];
  }
}

function save(owned: ThemeId[]): void {
  AsyncStorage.setItem(KEY, JSON.stringify({ ownedThemes: owned } satisfies Entitlements)).catch(
    () => {},
  );
}

/** Stubbed purchase: unlocks locally. Swapped for StoreKit in Phase 2. */
export async function unlockTheme(id: ThemeId): Promise<ThemeId[]> {
  const owned = await loadOwnedThemes();
  if (!owned.includes(id)) owned.push(id);
  save(owned);
  return owned;
}

/** Stubbed bundle purchase: unlocks everything, including future themes by design. */
export async function unlockAllThemes(): Promise<ThemeId[]> {
  const all = Object.keys(THEMES) as ThemeId[];
  save(all);
  return all;
}

/** Pre-shop installs may have a now-locked theme selected — let them keep it. */
export async function grandfatherTheme(id: ThemeId): Promise<ThemeId[]> {
  return unlockTheme(id);
}

/** Cross-platform confirm (RN Alert is a no-op on web). */
export function confirmDialog(title: string, message: string, action = 'Unlock'): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: action, onPress: () => resolve(true) },
    ]);
  });
}
