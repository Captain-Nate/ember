import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

import { THEME_IDS, THEMES, ThemeId } from '@/constants/themes';

const KEY = 'ember.entitlements.v1';

export const FREE_THEME: ThemeId = 'ember';
export const THEME_PRICE_LABEL = '$0.99';
export const BUNDLE_PRICE_LABEL = '$2.99';

export const BUNDLE_PRODUCT_ID = 'com.captainnate.ember.themes.all';

export function themeProductId(id: ThemeId): string {
  return `com.captainnate.ember.theme.${id}`;
}

export function themeIdForProduct(productId: string): ThemeId | 'bundle' | null {
  if (productId === BUNDLE_PRODUCT_ID) return 'bundle';
  const match = productId.match(/^com\.captainnate\.ember\.theme\.(\w+)$/);
  if (match && match[1] in THEMES) return match[1] as ThemeId;
  return null;
}

export const ALL_PRODUCT_IDS = [
  ...(Object.keys(THEMES) as ThemeId[])
    .filter((id) => id !== FREE_THEME)
    .map(themeProductId),
  BUNDLE_PRODUCT_ID,
];

/**
 * Dev switch (à la 1MS TESTING_ADS): true = every theme unlocked, no shop friction.
 * Phase 2 replaces the stubbed unlocks below with react-native-iap purchases;
 * planned product ids: com.captainnate.ember.theme.<id> and .themes.all.
 */
export const DEV_UNLOCK_ALL = false;

interface Entitlements {
  ownedThemes: ThemeId[];
  /** Set on bundle purchase — the bundle's public promise covers every future theme. */
  ownsBundle?: boolean;
}

/** The paid themes that existed before `ownsBundle` was stored (1.0.0). A
 *  record covering all of them predates the flag and can only have come from
 *  the bundle (or an equivalent spend), so it inherits the bundle's
 *  future-themes promise. Fixed list — must NOT grow as themes are added. */
const PRE_FLAG_BUNDLE_SET: ThemeId[] = [
  'verdant',
  'glacier',
  'amethyst',
  'rose',
  'sapphire',
  'moonlight',
];

async function loadStored(): Promise<Entitlements> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Entitlements) : null;
    return { ownedThemes: parsed?.ownedThemes ?? [], ownsBundle: parsed?.ownsBundle ?? false };
  } catch {
    return { ownedThemes: [], ownsBundle: false };
  }
}

export async function loadOwnedThemes(): Promise<ThemeId[]> {
  if (DEV_UNLOCK_ALL) return [...THEME_IDS];
  const stored = await loadStored();
  const owned = new Set<ThemeId>(stored.ownedThemes);
  owned.add(FREE_THEME);
  const ownsBundle = stored.ownsBundle || PRE_FLAG_BUNDLE_SET.every((id) => owned.has(id));
  if (ownsBundle) {
    // Upgrade pre-flag records, and sweep in any theme added since last save.
    if (!stored.ownsBundle || THEME_IDS.some((id) => !owned.has(id)))
      save({ ownedThemes: [...THEME_IDS], ownsBundle: true });
    return [...THEME_IDS];
  }
  return [...owned].filter((id) => id in THEMES);
}

function save(ent: Entitlements): void {
  AsyncStorage.setItem(KEY, JSON.stringify(ent)).catch(() => {});
}

/** Stubbed purchase: unlocks locally. Swapped for StoreKit in Phase 2. */
export async function unlockTheme(id: ThemeId): Promise<ThemeId[]> {
  const stored = await loadStored();
  if (!stored.ownedThemes.includes(id)) stored.ownedThemes.push(id);
  save(stored);
  if (stored.ownsBundle) return [...THEME_IDS];
  const owned = new Set<ThemeId>([FREE_THEME, ...stored.ownedThemes]);
  return [...owned].filter((themeId) => themeId in THEMES);
}

/** Bundle purchase: unlocks everything, including future themes by design. */
export async function unlockAllThemes(): Promise<ThemeId[]> {
  save({ ownedThemes: [...THEME_IDS], ownsBundle: true });
  return [...THEME_IDS];
}

/** Pre-shop installs may have a now-locked theme selected — let them keep it. */
export async function grandfatherTheme(id: ThemeId): Promise<ThemeId[]> {
  return unlockTheme(id);
}

/** Cross-platform info popup (RN Alert is a no-op on web). */
export function infoDialog(message: string): void {
  if (Platform.OS === 'web') {
    window.alert(message);
  } else {
    Alert.alert('', message);
  }
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
