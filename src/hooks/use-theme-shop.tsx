import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
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

type AnyProduct = { id?: string; productId?: string; displayPrice?: string };
type AnyPurchase = { id?: string; productId?: string };

interface IAPContextValue {
  connected: boolean;
  products: AnyProduct[];
  /** Always-current products list (state snapshots go stale across awaits). */
  productsRef: React.RefObject<AnyProduct[]>;
  fetchCatalog: () => Promise<AnyProduct[] | null>;
  purchase: (sku: string) => Promise<void>;
  availablePurchases: () => Promise<AnyPurchase[]>;
  announceOwned: (owned: ThemeId[]) => void;
  addOwnedListener: (listener: (owned: ThemeId[]) => void) => () => void;
}

const IAPContext = createContext<IAPContextValue | null>(null);

/**
 * Owns the app's single StoreKit connection. Mount once in the root layout —
 * per-screen connections tear each other down when screens unmount.
 */
export function IAPShopProvider({ children }: { children: ReactNode }) {
  const listenersRef = useRef(new Set<(owned: ThemeId[]) => void>());
  const announceOwned = useCallback((owned: ThemeId[]) => {
    listenersRef.current.forEach((listener) => listener(owned));
  }, []);

  const iapRef = useRef<ReturnType<IAPHook> | null>(null);

  const iap = (useIAPImpl ?? useIAPStub)({
    onPurchaseSuccess: async (purchase) => {
      const anyPurchase = purchase as AnyPurchase;
      const target = themeIdForProduct(anyPurchase.productId ?? anyPurchase.id ?? '');
      if (target) {
        const owned = target === 'bundle' ? await unlockAllThemes() : await unlockTheme(target);
        announceOwned(owned);
      }
      try {
        await iapRef.current?.finishTransaction({ purchase, isConsumable: false });
      } catch {}
    },
    onPurchaseError: (error) => {
      const anyError = error as { code?: string; message?: string };
      const code = String(anyError?.code ?? '');
      if (code.toUpperCase().includes('CANCEL')) return;
      console.log('[shop] purchase error', code, anyError?.message);
      infoDialog(
        `The purchase did not go through. Nothing was charged.${
          __DEV__ ? `\n\n[dev] ${code}: ${anyError?.message ?? 'no message'}` : ''
        }`,
      );
    },
  });
  iapRef.current = iap;

  const productsRef = useRef<AnyProduct[]>([]);
  useEffect(() => {
    productsRef.current = iap.products as AnyProduct[];
    console.log(`[shop] iap connected=${iap.connected} products=${iap.products.length}`);
  }, [iap.connected, iap.products]);

  useEffect(() => {
    if (iap.connected) {
      iap.fetchProducts({ skus: ALL_PRODUCT_IDS, type: 'in-app' }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iap.connected]);

  const value = useMemo<IAPContextValue>(
    () => ({
      connected: iap.connected,
      products: iap.products as AnyProduct[],
      productsRef,
      fetchCatalog: async () => {
        try {
          const result = await iapRef.current?.fetchProducts({
            skus: ALL_PRODUCT_IDS,
            type: 'in-app',
          });
          return Array.isArray(result) ? (result as AnyProduct[]) : null;
        } catch {
          return null;
        }
      },
      purchase: async (sku: string) => {
        await iapRef.current?.requestPurchase({
          request: { apple: { sku } },
          type: 'in-app',
        });
      },
      availablePurchases: async () => {
        const result = await iapRef.current?.getAvailablePurchases();
        if (Array.isArray(result)) return result as AnyPurchase[];
        return (iapRef.current?.availablePurchases ?? []) as AnyPurchase[];
      },
      announceOwned,
      addOwnedListener: (listener) => {
        listenersRef.current.add(listener);
        return () => {
          listenersRef.current.delete(listener);
        };
      },
    }),
    [iap.connected, iap.products, announceOwned],
  );

  return <IAPContext.Provider value={value}>{children}</IAPContext.Provider>;
}

export function useThemeShop(onOwnedChanged: (owned: ThemeId[]) => void) {
  const ctx = useContext(IAPContext);

  const onChangedRef = useRef(onOwnedChanged);
  useEffect(() => {
    onChangedRef.current = onOwnedChanged;
  }, [onOwnedChanged]);

  useEffect(() => {
    if (!ctx) return;
    return ctx.addOwnedListener((owned) => onChangedRef.current(owned));
  }, [ctx]);

  const notify = useCallback(
    (owned: ThemeId[]) => {
      if (ctx) ctx.announceOwned(owned);
      else onChangedRef.current(owned);
    },
    [ctx],
  );

  /** True when a real store catalog is usable; re-fetches once if needed. */
  const ensureReady = useCallback(async (): Promise<boolean> => {
    if (!ctx || !ctx.connected) return false;
    if ((ctx.productsRef.current?.length ?? 0) > 0) return true;
    const fetched = await ctx.fetchCatalog();
    return (fetched?.length ?? ctx.productsRef.current?.length ?? 0) > 0;
  }, [ctx]);

  const priceFor = useCallback(
    (kind: ThemeId | 'bundle'): string => {
      const sku = kind === 'bundle' ? BUNDLE_PRODUCT_ID : themeProductId(kind);
      const product = ctx?.products.find((p) => (p.id ?? p.productId) === sku);
      return product?.displayPrice ?? (kind === 'bundle' ? BUNDLE_PRICE_LABEL : THEME_PRICE_LABEL);
    },
    [ctx?.products],
  );

  const buyTheme = useCallback(
    async (id: ThemeId) => {
      if (!(await ensureReady())) {
        const ok = await confirmDialog(
          `Unlock ${THEMES[id].name}?`,
          `${THEME_PRICE_LABEL} — adds a new flame and candle color.`,
        );
        if (!ok) return;
        notify(await unlockTheme(id));
        return;
      }
      try {
        await ctx!.purchase(themeProductId(id));
      } catch {}
    },
    [ensureReady, notify, ctx],
  );

  const buyBundle = useCallback(async () => {
    if (!(await ensureReady())) {
      const ok = await confirmDialog(
        'Unlock all themes?',
        `${BUNDLE_PRICE_LABEL} — every theme, including all future ones.`,
      );
      if (!ok) return;
      notify(await unlockAllThemes());
      return;
    }
    try {
      await ctx!.purchase(BUNDLE_PRODUCT_ID);
    } catch {}
  }, [ensureReady, notify, ctx]);

  const restore = useCallback(async () => {
    if (!(await ensureReady())) {
      infoDialog('Purchase restoring arrives with the App Store version of Ember.');
      return;
    }
    try {
      const purchases = await ctx!.availablePurchases();
      let owned: ThemeId[] | null = null;
      for (const purchase of purchases) {
        const target = themeIdForProduct(purchase.productId ?? purchase.id ?? '');
        if (target === 'bundle') owned = await unlockAllThemes();
        else if (target) owned = await unlockTheme(target);
      }
      if (owned) {
        notify(owned);
        infoDialog('Purchases restored.');
      } else {
        infoDialog('No previous purchases found.');
      }
    } catch {
      infoDialog('Could not reach the store. Try again in a moment.');
    }
  }, [ensureReady, notify, ctx]);

  return { priceFor, buyTheme, buyBundle, restore };
}
