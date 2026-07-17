import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Flame } from '@/components/flame';
import { palette } from '@/constants/palette';
import { THEME_IDS, THEME_STORAGE_KEY, THEMES, ThemeId } from '@/constants/themes';
import {
  BUNDLE_PRICE_LABEL,
  confirmDialog,
  FREE_THEME,
  loadOwnedThemes,
  THEME_PRICE_LABEL,
  unlockAllThemes,
  unlockTheme,
} from '@/lib/entitlements';

function infoDialog(message: string): void {
  if (Platform.OS === 'web') {
    window.alert(message);
  } else {
    Alert.alert('', message);
  }
}

export default function ShopScreen() {
  const [owned, setOwned] = useState<ThemeId[]>([FREE_THEME]);
  const [selectedId, setSelectedId] = useState<ThemeId>(FREE_THEME);

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

  const select = (id: ThemeId) => {
    setSelectedId(id);
    AsyncStorage.setItem(THEME_STORAGE_KEY, id).catch(() => {});
  };

  const buyTheme = async (id: ThemeId) => {
    const ok = await confirmDialog(
      `Unlock ${THEMES[id].name}?`,
      `${THEME_PRICE_LABEL} — adds a new flame and candle color.`,
    );
    if (!ok) return;
    setOwned(await unlockTheme(id));
    select(id);
  };

  const buyBundle = async () => {
    const ok = await confirmDialog(
      'Unlock all themes?',
      `${BUNDLE_PRICE_LABEL} — every theme, including all future ones.`,
    );
    if (!ok) return;
    setOwned(await unlockAllThemes());
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
          onPress={ownsAll ? undefined : buyBundle}
        >
          <View style={styles.bundleDots}>
            {(['verdant', 'glacier', 'amethyst', 'rose', 'sapphire', 'moonlight'] as ThemeId[]).map(
              (id) => (
                <View key={id} style={[styles.bundleDot, { backgroundColor: THEMES[id].accent }]} />
              ),
            )}
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
                {BUNDLE_PRICE_LABEL}
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
              <Flame mood="idle" size={34} colors={theme.flame} />
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
                    {THEME_PRICE_LABEL}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}

        <Pressable
          onPress={() =>
            infoDialog('Purchase restoring arrives with the App Store version of Ember.')
          }
        >
          <Text style={styles.restore}>Restore purchases</Text>
        </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  backBtn: {
    backgroundColor: palette.card,
    borderColor: palette.cardBorder,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    minWidth: 76,
    alignItems: 'center',
  },
  backText: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: palette.ink,
    fontSize: 17,
    fontWeight: '700',
  },
  headerSpacer: {
    minWidth: 76,
  },
  subtitle: {
    color: palette.inkDim,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 40,
  },
  list: {
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
    paddingVertical: 14,
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
    width: 14,
    height: 14,
    borderRadius: 7,
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
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  rowBody: {
    flex: 1,
  },
  rowName: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  rowCaption: {
    color: palette.inkDim,
    fontSize: 11,
    marginTop: 1,
  },
  ownedLabel: {
    color: palette.inkDim,
    fontSize: 13,
  },
  pricePill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 13,
  },
  pricePillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  restore: {
    color: palette.inkDim,
    fontSize: 12,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 14,
  },
});
