import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { DevSettings, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Flame } from '@/components/flame';
import { CONTENT_MAX_WIDTH, HEADER_TOP_PAD, padSize } from '@/constants/layout';
import { palette } from '@/constants/palette';
import { THEME_IDS, THEME_STORAGE_KEY, THEMES, ThemeId } from '@/constants/themes';
import { confirmDialog, FREE_THEME, loadOwnedThemes } from '@/lib/entitlements';
import { useThemeShop } from '@/hooks/use-theme-shop';

export default function ShopScreen() {
  const [owned, setOwned] = useState<ThemeId[]>([FREE_THEME]);
  const [selectedId, setSelectedId] = useState<ThemeId>(FREE_THEME);
  const pendingSelectRef = useRef<ThemeId | null>(null);

  const select = useCallback((id: ThemeId) => {
    setSelectedId(id);
    AsyncStorage.setItem(THEME_STORAGE_KEY, id).catch(() => {});
  }, []);

  const shop = useThemeShop(
    useCallback(
      (nextOwned: ThemeId[]) => {
        setOwned(nextOwned);
        const pending = pendingSelectRef.current;
        if (pending && nextOwned.includes(pending)) {
          pendingSelectRef.current = null;
          select(pending);
        }
      },
      [select],
    ),
  );

  useFocusEffect(
    useCallback(() => {
      loadOwnedThemes().then(setOwned);
      AsyncStorage.getItem(THEME_STORAGE_KEY)
        .then((raw) => {
          if (raw && raw in THEMES) setSelectedId(raw as ThemeId);
        })
        .catch(() => {});
    }, []),
  );

  const ownsAll = THEME_IDS.every((id) => owned.includes(id));

  const buyTheme = (id: ThemeId) => {
    pendingSelectRef.current = id;
    shop.buyTheme(id);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Theme shop</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.subtitle}>Every theme adds a new candle color to your collection</Text>

      <ScrollView contentContainerStyle={styles.list}>
        <Pressable
          style={[styles.bundleCard, ownsAll && styles.bundleCardOwned]}
          onPress={ownsAll ? undefined : shop.buyBundle}
        >
          <View style={styles.bundleDots}>
            {THEME_IDS.filter((id) => id !== FREE_THEME).map((id) => (
              <View key={id} style={[styles.bundleDot, { backgroundColor: THEMES[id].accent }]} />
            ))}
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowName}>All themes</Text>
            <Text style={styles.rowCaption}>Includes every future theme</Text>
          </View>
          {ownsAll ? (
            <Text style={styles.ownedLabel}>Owned</Text>
          ) : (
            <View style={[styles.pricePill, { backgroundColor: THEMES.amethyst.accent }]}>
              <Text style={[styles.pricePillText, { color: THEMES.amethyst.buttonInk }]}>
                {shop.priceFor('bundle')}
              </Text>
            </View>
          )}
        </Pressable>

        {THEME_IDS.map((id) => {
          const theme = THEMES[id];
          const isOwned = owned.includes(id);
          const isSelected = selectedId === id;
          return (
            <Pressable
              key={id}
              style={styles.row}
              onPress={() => {
                if (isOwned) {
                  select(id);
                  router.back();
                } else {
                  buyTheme(id);
                }
              }}
            >
              <Flame mood="idle" size={padSize(34)} colors={theme.flame} />
              <View style={styles.rowBody}>
                <Text style={styles.rowName}>{theme.name}</Text>
                {isSelected && <Text style={styles.rowCaption}>Selected</Text>}
              </View>
              {id === FREE_THEME ? (
                <Text style={styles.ownedLabel}>Free · default</Text>
              ) : isOwned ? (
                <Text style={styles.ownedLabel}>Owned</Text>
              ) : (
                <View style={[styles.pricePill, { backgroundColor: theme.accent }]}>
                  <Text style={[styles.pricePillText, { color: theme.buttonInk }]}>
                    {shop.priceFor(id)}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}

        <Pressable onPress={shop.restore}>
          <Text style={styles.restore}>Restore purchases</Text>
        </Pressable>

        {__DEV__ && (
          <Pressable
            onPress={async () => {
              const ok = await confirmDialog(
                'Reset ALL data?',
                'Dev only — wipes purchases, theme, streak, candles, and settings, then reloads. Like a fresh install.',
                'Reset everything',
              );
              if (!ok) return;
              await AsyncStorage.multiRemove([
                'ember.entitlements.v1',
                'ember.theme.v1',
                'ember.stats.v1',
                'ember.sessions.v1',
                'ember.customMin.v1',
              ]).catch(() => {});
              if (Platform.OS === 'web') {
                window.location.href = '/';
              } else {
                DevSettings.reload();
              }
            }}
          >
            <Text style={styles.devReset}>Reset all data (dev)</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  header: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: HEADER_TOP_PAD,
  },
  backBtn: {
    backgroundColor: palette.card,
    borderColor: palette.cardBorder,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: padSize(7),
    paddingHorizontal: 14,
    minWidth: padSize(76),
    alignItems: 'center',
  },
  backText: {
    color: palette.ink,
    fontSize: padSize(15),
    fontWeight: '600',
  },
  title: {
    color: palette.ink,
    fontSize: padSize(17),
    fontWeight: '700',
  },
  headerSpacer: {
    minWidth: padSize(76),
  },
  subtitle: {
    color: palette.inkDim,
    fontSize: padSize(13),
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 40,
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  list: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 40,
    gap: 10,
  },
  bundleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1A1530',
    borderWidth: 1.5,
    borderColor: THEMES.amethyst.accent,
    borderRadius: 14,
    paddingVertical: padSize(14),
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  bundleCardOwned: {
    borderColor: palette.cardBorder,
    backgroundColor: palette.card,
  },
  bundleDots: {
    flexDirection: 'row',
  },
  bundleDot: {
    width: padSize(14),
    height: padSize(14),
    borderRadius: padSize(14) / 2,
    marginRight: -4,
    borderWidth: 1,
    borderColor: palette.bg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.card,
    borderRadius: 12,
    paddingVertical: padSize(10),
    paddingHorizontal: 14,
  },
  rowBody: {
    flex: 1,
  },
  rowName: {
    color: palette.ink,
    fontSize: padSize(15),
    fontWeight: '600',
  },
  rowCaption: {
    color: palette.inkDim,
    fontSize: padSize(11),
    marginTop: 1,
  },
  ownedLabel: {
    color: palette.inkDim,
    fontSize: padSize(13),
  },
  pricePill: {
    borderRadius: 999,
    paddingVertical: padSize(6),
    paddingHorizontal: 13,
  },
  pricePillText: {
    fontSize: padSize(13),
    fontWeight: '700',
  },
  restore: {
    color: palette.inkDim,
    fontSize: padSize(12),
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 14,
  },
  devReset: {
    color: palette.danger,
    fontSize: padSize(12),
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 12,
  },
});
