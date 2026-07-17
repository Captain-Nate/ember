import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { THEMES, ThemeId } from '@/constants/themes';
import {
  ALL_PRODUCT_IDS,
  BUNDLE_PRICE_LABEL,
  BUNDLE_PRODUCT_ID,
  confirmDialog,
  infoDialog,
  THEME_PRICE_LABEL,
  themeIdForProduct,
  themeProductId,
  unlockAllThemes,
  unlockTheme,
} from '@/lib/entitlements';

// expo-iap needs its native module; fall back to stubbed local unlocks on web,
// in builds that predate the module, or when no store is configured.
type IAPHook = typeof import('expo-iap').useIAP;

let useIAPImpl: IAPHook | null = null;
try {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    useIAPImpl = require('expo-iap').useIAP;
  }
} catch {
  useIAPImpl = null;
}

const useIAPStub = (() => ({
  connected: false,
  products: [],
  fetchProducts: async () => {},
  requestPurchase: async () => {},
  finishTransaction: async () => {},
  getAvailablePurchases: async () => {},
  availablePurchases: [],
})) as unknown as IAPHook;

export function useThemeShop(onOwnedChanged: (owned: ThemeId[]) => void) {
  const onChangedRef = useRef(onOwnedChanged);
  useEffect(() => {
    onChangedRef.current = onOwnedChanged;
  }, [onOwnedChanged]);

  const iapRef = useRef<ReturnType<IAPHook> | null>(null);

  const iap = (useIAPImpl ?? useIAPStub)({
    onPurchaseSuccess: async (purchase) => {
      const anyPurchase = purchase as { productId?: string; id?: string };
      const target = themeIdForProduct(anyPurchase.productId ?? anyPurchase.id ?? '');
      if (target) {
        const owned = target === 'bundle' ? await unlockAllThemes() : await unlockTheme(target);
        onChangedRef.current(owned);
      }
      try {
        await iapRef.current?.finishTransaction({ purchase, isConsumable: false });
      } catch {}
    },
    onPurchaseError: (error) => {
      const code = String((error as { code?: string })?.code ?? '');
      if (code.toUpperCase().includes('CANCEL')) return;
      infoDialog('The purchase did not go through. Nothing was charged.');
    },
  });
  iapRef.current = iap;

  const { connected, products, fetchProducts } = iap;

  useEffect(() => {
    if (connected) {
      fetchProducts({ skus: ALL_PRODUCT_IDS, type: 'in-app' }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  useEffect(() => {
    console.log(`[shop] iap connected=${connected} products=${products.length}`);
  }, [connected, products.length]);

  const iapReady = connected && products.length > 0;

  /** Re-fetch once on demand — first fetch may not have landed (or store just attached). */
  const ensureReady = useCallback(async (): Promise<boolean> => {
    if (iapReady) return true;
    if (!connected) return false;
    try {
      await fetchProducts({ skus: ALL_PRODUCT_IDS, type: 'in-app' });
    } catch {}
    return ((iapRef.current?.products?.length ?? 0) as number) > 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iapReady, connected]);

  const priceFor = useCallback(
    (kind: ThemeId | 'bundle'): string => {
      const sku = kind === 'bundle' ? BUNDLE_PRODUCT_ID : themeProductId(kind);
      const product = products.find(
        (p) => ((p as { id?: string }).id ?? (p as { productId?: string }).productId) === sku,
      );
      const display = (product as { displayPrice?: string } | undefined)?.displayPrice;
      return display ?? (kind === 'bundle' ? BUNDLE_PRICE_LABEL : THEME_PRICE_LABEL);
    },
    [products],
  );

  const buyTheme = useCallback(
    async (id: ThemeId) => {
      if (!(await ensureReady())) {
        const ok = await confirmDialog(
          `Unlock ${THEMES[id].name}?`,
          `${THEME_PRICE_LABEL} — adds a new flame and candle color.`,
        );
        if (!ok) return;
        onChangedRef.current(await unlockTheme(id));
        return;
      }
      try {
        await iap.requestPurchase({
          request: { apple: { sku: themeProductId(id) } },
          type: 'in-app',
        });
      } catch {}
    },
    [ensureReady, iap],
  );

  const buyBundle = useCallback(async () => {
    if (!(await ensureReady())) {
      const ok = await confirmDialog(
        'Unlock all themes?',
        `${BUNDLE_PRICE_LABEL} — every theme, including all future ones.`,
      );
      if (!ok) return;
      onChangedRef.current(await unlockAllThemes());
      return;
    }
    try {
      await iap.requestPurchase({
        request: { apple: { sku: BUNDLE_PRODUCT_ID } },
        type: 'in-app',
      });
    } catch {}
  }, [ensureReady, iap]);

  const restore = useCallback(async () => {
    if (!(await ensureReady())) {
      infoDialog('Purchase restoring arrives with the App Store version of Ember.');
      return;
    }
    try {
      const result = await iap.getAvailablePurchases();
      const list = Array.isArray(result) ? result : (iap.availablePurchases ?? []);
      let owned: ThemeId[] | null = null;
      for (const purchase of list) {
        const anyPurchase = purchase as { productId?: string; id?: string };
        const target = themeIdForProduct(anyPurchase.productId ?? anyPurchase.id ?? '');
        if (target === 'bundle') owned = await unlockAllThemes();
        else if (target) owned = await unlockTheme(target);
      }
      if (owned) {
        onChangedRef.current(owned);
        infoDialog('Purchases restored.');
      } else {
        infoDialog('No previous purchases found.');
      }
    } catch {
      infoDialog('Could not reach the store. Try again in a moment.');
    }
  }, [ensureReady, iap]);

  return { iapReady, priceFor, buyTheme, buyBundle, restore };
}
