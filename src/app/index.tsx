import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';

import { Candle } from '@/components/candle';
import { Flame, FlameMood } from '@/components/flame';
import { ProgressRing } from '@/components/progress-ring';
import { UnlockBurst } from '@/components/unlock-burst';
import { palette } from '@/constants/palette';
import { THEME_IDS, THEME_STORAGE_KEY, THEMES, ThemeId } from '@/constants/themes';
import { formatMs, useFocusTimer } from '@/hooks/use-focus-timer';
import { useThemeShop } from '@/hooks/use-theme-shop';
import { grandfatherTheme, loadOwnedThemes } from '@/lib/entitlements';

const PRESETS = [15, 25, 50];
const CUSTOM_KEY = 'ember.customMin.v1';
const CUSTOM_MIN = 1;
const CUSTOM_MAX = 180;

const MOOD_BY_STATUS: Record<string, FlameMood> = {
  idle: 'idle',
  running: 'focused',
  done: 'happy',
  doused: 'doused',
};

function PopIn({ children }: { children: ReactNode }) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const native = Platform.OS !== 'web';
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: native }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: native }),
    ]).start();
  }, [scale, opacity]);
  return (
    <Animated.View style={{ transform: [{ scale }], opacity, alignItems: 'center', gap: 8 }}>
      {children}
    </Animated.View>
  );
}

export default function FocusScreen() {
  const [themeId, setThemeId] = useState<ThemeId>('ember');
  const [owned, setOwned] = useState<ThemeId[]>(['ember']);
  const theme = THEMES[themeId];
  const timer = useFocusTimer(themeId);
  const { status } = timer;
  const [customMin, setCustomMin] = useState(30);
  const [customActive, setCustomActive] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CUSTOM_KEY)
      .then((raw) => {
        const n = Number(raw);
        if (n >= CUSTOM_MIN && n <= CUSTOM_MAX) setCustomMin(n);
      })
      .catch(() => {});
    (async () => {
      const [raw, ownedList] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY).catch(() => null),
        loadOwnedThemes(),
      ]);
      let nextOwned = ownedList;
      if (raw && raw in THEMES) {
        const stored = raw as ThemeId;
        // pre-shop installs keep whatever theme they already had selected
        if (!nextOwned.includes(stored)) nextOwned = await grandfatherTheme(stored);
        setThemeId(stored);
      }
      setOwned(nextOwned);
      prevOwnedRef.current = nextOwned;
      storageReadyRef.current = true;
    })();
  }, []);

  // refresh after the shop screen unlocks or switches themes
  useFocusEffect(
    useCallback(() => {
      loadOwnedThemes().then(setOwned);
      AsyncStorage.getItem(THEME_STORAGE_KEY)
        .then((raw) => {
          if (raw && raw in THEMES) setThemeId(raw as ThemeId);
        })
        .catch(() => {});
    }, []),
  );

  const isPreviewing = !owned.includes(themeId);

  const shop = useThemeShop(useCallback((nextOwned: ThemeId[]) => setOwned(nextOwned), []));

  // A theme the user is looking at just became owned → celebrate the unlock.
  const [celebrating, setCelebrating] = useState(false);
  const prevOwnedRef = useRef<ThemeId[]>(owned);
  useEffect(() => {
    const wasOwned = prevOwnedRef.current.includes(themeId);
    prevOwnedRef.current = owned;
    if (storageReadyRef.current && !wasOwned && owned.includes(themeId)) {
      setCelebrating(true);
    }
  }, [owned, themeId]);

  // Persist the selection whenever it points at an owned theme (previews never persist).
  const storageReadyRef = useRef(false);
  useEffect(() => {
    if (storageReadyRef.current && owned.includes(themeId)) {
      AsyncStorage.setItem(THEME_STORAGE_KEY, themeId).catch(() => {});
    }
  }, [owned, themeId]);

  const selectTheme = (id: ThemeId) => {
    setThemeId(id); // locked themes apply as a live preview
  };

  const adjustCustom = (delta: number) => {
    const next = Math.min(CUSTOM_MAX, Math.max(CUSTOM_MIN, customMin + delta));
    setCustomMin(next);
    timer.selectDuration(next);
    AsyncStorage.setItem(CUSTOM_KEY, String(next)).catch(() => {});
  };

  const statusLine =
    status === 'running'
      ? timer.progress < 1 / 3
        ? 'The flame is lit — stay with it'
        : timer.progress < 2 / 3
          ? 'Burning steady'
          : 'Roaring — almost there'
      : status === 'done'
        ? '+1 session — the flame grows brighter'
        : status === 'doused'
          ? 'The flame went out…'
          : [
              timer.streak > 0 ? `${timer.streak} day streak` : null,
              timer.todayCount > 0
                ? `${timer.todayCount} session${timer.todayCount === 1 ? '' : 's'} today`
                : null,
            ]
              .filter(Boolean)
              .join(' · ') || 'Ready to focus?';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={[styles.wordmark, { color: theme.accent }]}>ember</Text>
        <View style={styles.headerRight}>
          <Pressable style={styles.streakChip} onPress={() => router.push('/collection')}>
            <Text style={styles.streakText}>Candles</Text>
          </Pressable>
          <Pressable style={styles.streakChip} onPress={() => router.push('/shop')}>
            <Text style={styles.streakText}>Shop</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.center}>
        <View>
          <ProgressRing
            size={284}
            strokeWidth={12}
            progress={timer.progress}
            from={theme.accent}
            to={theme.accentDeep}
          >
            <Flame
              mood={celebrating ? 'happy' : MOOD_BY_STATUS[status]}
              size={150}
              colors={theme.flame}
            />
          </ProgressRing>
          {celebrating && (
            <UnlockBurst
              colors={[theme.accent, theme.flame.bodyMid, theme.flame.innerTop]}
              onDone={() => setCelebrating(false)}
            />
          )}
        </View>

        <Text style={styles.time}>{formatMs(timer.remainingMs)}</Text>
        <Text style={styles.statusLine}>{statusLine}</Text>

        <View style={styles.variableSlot}>
          {status === 'done' ? (
            <PopIn>
              <Candle themeId={themeId} minutes={timer.durationMin} height={76} />
              <Text style={styles.revealText}>Ember has lit a new candle for your collection</Text>
            </PopIn>
          ) : (
            <>
        <View style={styles.presetRow}>
          {status === 'idle' && (
            <>
              {PRESETS.map((min) => {
                const selected = !customActive && timer.durationMin === min;
                return (
                  <Pressable
                    key={min}
                    onPress={() => {
                      setCustomActive(false);
                      timer.selectDuration(min);
                    }}
                    style={[
                      styles.preset,
                      selected && { backgroundColor: theme.accent, borderColor: theme.accent },
                    ]}
                  >
                    <Text style={[styles.presetText, selected && { color: theme.buttonInk }]}>
                      {min} min
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => {
                  setCustomActive(true);
                  timer.selectDuration(customMin);
                }}
                style={[
                  styles.preset,
                  customActive && { backgroundColor: theme.accent, borderColor: theme.accent },
                ]}
              >
                <Text style={[styles.presetText, customActive && { color: theme.buttonInk }]}>
                  Custom
                </Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.stepperRow}>
          {status === 'idle' &&
            customActive &&
            (() => {
              const atMin = customMin <= CUSTOM_MIN;
              const atMax = customMin >= CUSTOM_MAX;
              return (
                <>
                  <Pressable
                    onPress={() => adjustCustom(-5)}
                    disabled={atMin}
                    style={[styles.stepperBtn, atMin && styles.stepperBtnDisabled]}
                  >
                    <Text style={[styles.stepperBtnText, { color: theme.accent }]}>−5</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => adjustCustom(-1)}
                    disabled={atMin}
                    style={[styles.stepperBtn, atMin && styles.stepperBtnDisabled]}
                  >
                    <Text style={[styles.stepperBtnText, { color: theme.accent }]}>−1</Text>
                  </Pressable>
                  <Text style={styles.stepperValue}>{customMin} min</Text>
                  <Pressable
                    onPress={() => adjustCustom(1)}
                    disabled={atMax}
                    style={[styles.stepperBtn, atMax && styles.stepperBtnDisabled]}
                  >
                    <Text style={[styles.stepperBtnText, { color: theme.accent }]}>+1</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => adjustCustom(5)}
                    disabled={atMax}
                    style={[styles.stepperBtn, atMax && styles.stepperBtnDisabled]}
                  >
                    <Text style={[styles.stepperBtnText, { color: theme.accent }]}>+5</Text>
                  </Pressable>
                </>
              );
            })()}
        </View>

        <View style={styles.swatchRow}>
          {status === 'idle' && (
            <>
              {THEME_IDS.map((id) => {
                const selected = id === themeId;
                const locked = !owned.includes(id);
                return (
                  <Pressable key={id} onPress={() => selectTheme(id)} style={styles.swatchWrap}>
                    <View
                      style={[
                        styles.swatch,
                        { backgroundColor: THEMES[id].accent },
                        selected && styles.swatchSelected,
                      ]}
                    />
                    {locked && (
                      <View style={styles.lockBadge}>
                        <Svg width={8} height={8} viewBox="0 0 12 12">
                          <Path
                            d="M3.5 5 V3.5 a2.5 2.5 0 0 1 5 0 V5"
                            stroke={palette.ink}
                            strokeWidth={1.6}
                            fill="none"
                            strokeLinecap="round"
                          />
                          <Rect x={2.4} y={5} width={7.2} height={5.2} rx={1.6} fill={palette.ink} />
                        </Svg>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </>
          )}
        </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        {status === 'idle' &&
          (isPreviewing ? (
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
              onPress={() => shop.buyTheme(themeId)}
            >
              <Text style={[styles.primaryBtnText, { color: theme.buttonInk }]}>
                Unlock {theme.name} · {shop.priceFor(themeId)}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
              onPress={() => timer.start()}
            >
              <Text style={[styles.primaryBtnText, { color: theme.buttonInk }]}>
                Light the flame
              </Text>
            </Pressable>
          ))}
        {status === 'running' && (
          <Pressable style={styles.giveUpBtn} onPress={timer.giveUp}>
            <Text style={styles.giveUpBtnText}>Give up</Text>
          </Pressable>
        )}
        {status === 'done' && (
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
            onPress={timer.dismissDone}
          >
            <Text style={[styles.primaryBtnText, { color: theme.buttonInk }]}>Continue</Text>
          </Pressable>
        )}
        {status === 'doused' && (
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
            onPress={timer.dismissDone}
          >
            <Text style={[styles.primaryBtnText, { color: theme.buttonInk }]}>Go back</Text>
          </Pressable>
        )}
        <View style={styles.hintSlot}>
          {status === 'running' && (
            <Text style={styles.footerHint}>
              Leaving the app puts the flame out — locking your phone is safe
            </Text>
          )}
          {status === 'idle' && isPreviewing && (
            <Pressable onPress={shop.buyBundle}>
              <Text style={[styles.footerHint, styles.bundleLink]}>
                or get all themes · {shop.priceFor('bundle')}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
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
  wordmark: {
    color: palette.amber,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  revealText: {
    color: palette.inkDim,
    fontSize: 13,
  },
  streakChip: {
    backgroundColor: palette.card,
    borderColor: palette.cardBorder,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  streakText: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingTop: 14,
  },
  time: {
    color: palette.ink,
    fontSize: 56,
    fontWeight: '200',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  statusLine: {
    color: palette.inkDim,
    fontSize: 15,
  },
  variableSlot: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
    height: 40,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
  },
  stepperBtn: {
    width: 46,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  stepperBtnDisabled: {
    opacity: 0.35,
  },
  stepperBtnText: {
    color: palette.amber,
    fontSize: 16,
    fontWeight: '700',
  },
  stepperValue: {
    color: palette.ink,
    fontSize: 17,
    fontWeight: '600',
    minWidth: 70,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  preset: {
    borderRadius: 999,
    paddingHorizontal: 18,
    justifyContent: 'center',
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  presetSelected: {
    backgroundColor: palette.amber,
    borderColor: palette.amber,
  },
  presetText: {
    color: palette.inkDim,
    fontSize: 14,
    fontWeight: '600',
  },
  presetTextSelected: {
    color: palette.buttonInk,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  primaryBtn: {
    backgroundColor: palette.amber,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  primaryBtnText: {
    color: palette.buttonInk,
    fontSize: 17,
    fontWeight: '700',
  },
  giveUpBtn: {
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,107,0.35)',
  },
  giveUpBtnText: {
    color: palette.danger,
    fontSize: 17,
    fontWeight: '600',
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 30,
  },
  swatchWrap: {
    width: 26,
    height: 26,
  },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: palette.ink,
  },
  lockBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: palette.bg,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bundleLink: {
    textDecorationLine: 'underline',
  },
  hintSlot: {
    height: 40,
    justifyContent: 'center',
  },
  footerHint: {
    color: palette.inkDim,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});
