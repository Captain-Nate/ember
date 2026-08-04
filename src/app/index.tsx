import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';

import { Candle } from '@/components/candle';
import { Flame, FlameMood } from '@/components/flame';
import { ProgressRing } from '@/components/progress-ring';
import { UnlockBurst } from '@/components/unlock-burst';
import {
  CONTENT_MAX_WIDTH,
  HEADER_TOP_PAD,
  IS_PAD,
  lineHeightFor,
  padSize,
} from '@/constants/layout';
import { palette } from '@/constants/palette';
import { THEME_IDS, THEME_STORAGE_KEY, THEMES, ThemeId } from '@/constants/themes';
import { formatMs, useFocusTimer } from '@/hooks/use-focus-timer';
import { useThemeShop } from '@/hooks/use-theme-shop';
import { grandfatherTheme, loadOwnedThemes } from '@/lib/entitlements';

const PRESETS = [15, 25, 50];
const CUSTOM_KEY = 'ember.customMin.v1';
const CUSTOM_MIN = 1;
const CUSTOM_MAX = 180;

// Art sizes on a tall phone. The ring/flame/clock shrink together on short
// screens (iPhone SE, and iPhone compatibility mode on iPad) so the header and
// the controls below never get overlapped. The controls themselves never
// scale — they'd drop under the 44pt tap target.
const RING_BASE = 284;
const FLAME_BASE = 150;
const TIME_BASE = 56;
const TIME_LINE_RATIO = 1.2;
// Control metrics. Each goes through padSize() so iPad gets larger type AND
// correspondingly larger tap targets. The vertical-chrome totals below are
// derived from these rather than hard-coded, so they cannot drift out of sync
// with the stylesheet and silently reintroduce the overlap this fixes.
const GAP = padSize(18);
const PRESET_H = padSize(40);
const STEPPER_H = padSize(44);
const SWATCH = padSize(26);
const SWATCH_ROW_H = padSize(30);
const CHIP_PAD_V = padSize(7);
const CHIP_FONT = padSize(15);
const STATUS_FONT = padSize(15);
const BTN_PAD_V = padSize(18);
const BTN_FONT = padSize(17);
const HINT_H = padSize(40);
const FOOTER_PAD_BOTTOM = padSize(16);
const CENTER_PAD_TOP = padSize(14);

const HEADER_H = CHIP_PAD_V * 2 + lineHeightFor(CHIP_FONT) + 2; // +2 chip border
const SLOT_H = PRESET_H + STEPPER_H + SWATCH_ROW_H + GAP * 2;
const CONTROLS_H = lineHeightFor(STATUS_FONT) + SLOT_H + GAP * 3 + CENTER_PAD_TOP;
const FOOTER_H = BTN_PAD_V * 2 + lineHeightFor(BTN_FONT) + 3 + HINT_H + FOOTER_PAD_BOTTOM;
// Slack held back from the art so a short screen still shows a clear gap
// between the swatches and the primary button, rather than an exact fit.
const ART_BREATHING_ROOM = 32;
const COLUMN_GUTTER = 48;
// Only iPad is allowed to grow the art past the phone design — scaling up on
// a big iPhone would change the layout the App Store screenshots were shot on.
const MAX_ART_SCALE_PAD = 1.35;
// Floor low enough that a short landscape iPad can still shrink the art until
// everything fits. Above ~0.39 the 11" landscape canvas cannot hold the art
// plus the control stack, and the content would spill over the footer button.
const MIN_ART_SCALE = 0.35;

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

  const { height: winHeight, width: winWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const headerHeight = HEADER_H + HEADER_TOP_PAD;
  const roomForArt =
    winHeight -
    insets.top -
    insets.bottom -
    headerHeight -
    FOOTER_H -
    CONTROLS_H -
    ART_BREATHING_ROOM;
  const columnWidth = Math.min(winWidth - COLUMN_GUTTER, CONTENT_MAX_WIDTH);
  const artScale = Math.max(
    MIN_ART_SCALE,
    Math.min(
      IS_PAD ? MAX_ART_SCALE_PAD : 1,
      roomForArt / (RING_BASE + TIME_BASE * TIME_LINE_RATIO),
      columnWidth / RING_BASE,
    ),
  );
  const ringSize = Math.round(RING_BASE * artScale);
  const flameSize = Math.round(FLAME_BASE * artScale);
  const timeFont = Math.round(TIME_BASE * artScale);

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
      <View style={[styles.headerBar, { paddingTop: HEADER_TOP_PAD }]}>
        <View style={[styles.headerInner, { maxWidth: CONTENT_MAX_WIDTH }]}>
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
      </View>

      <ScrollView
        style={styles.centerScroll}
        contentContainerStyle={styles.centerContent}
        showsVerticalScrollIndicator={false}
      >
      <View style={[styles.center, { maxWidth: CONTENT_MAX_WIDTH }]}>
        <View>
          <ProgressRing
            size={ringSize}
            strokeWidth={Math.max(8, Math.round(12 * artScale))}
            progress={timer.progress}
            from={theme.accent}
            to={theme.accentDeep}
          >
            <Flame
              mood={celebrating ? 'happy' : MOOD_BY_STATUS[status]}
              size={flameSize}
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

        <Text
          style={[
            styles.time,
            { fontSize: timeFont, lineHeight: Math.round(timeFont * TIME_LINE_RATIO) },
          ]}
        >
          {formatMs(timer.remainingMs)}
        </Text>
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
      </ScrollView>

      <View style={styles.footerBar}>
        <View style={[styles.footerInner, { maxWidth: CONTENT_MAX_WIDTH }]}>
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
              Leaving the app puts the flame out — locking your device is safe
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  headerBar: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerInner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    color: palette.amber,
    fontSize: padSize(22),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  revealText: {
    color: palette.inkDim,
    fontSize: padSize(13),
  },
  streakChip: {
    backgroundColor: palette.card,
    borderColor: palette.cardBorder,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: CHIP_PAD_V,
    paddingHorizontal: padSize(14),
  },
  streakText: {
    color: palette.ink,
    fontSize: CHIP_FONT,
    fontWeight: '700',
  },
  centerScroll: {
    flex: 1,
    overflow: 'hidden',
  },
  // flexGrow + centred justify means the content sits centred when it fits and
  // scrolls instead of clipping when the window is too short (iPadOS resizing).
  centerContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: CENTER_PAD_TOP,
  },
  center: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: GAP,
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
    fontSize: STATUS_FONT,
  },
  variableSlot: {
    height: SLOT_H,
    alignItems: 'center',
    justifyContent: 'center',
    gap: GAP,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
    height: PRESET_H,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: STEPPER_H,
  },
  stepperBtn: {
    width: padSize(46),
    height: STEPPER_H,
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
    fontSize: padSize(16),
    fontWeight: '700',
  },
  stepperValue: {
    color: palette.ink,
    fontSize: padSize(17),
    fontWeight: '600',
    minWidth: padSize(70),
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
    fontSize: padSize(14),
    fontWeight: '600',
  },
  presetTextSelected: {
    color: palette.buttonInk,
  },
  footerBar: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: FOOTER_PAD_BOTTOM,
  },
  footerInner: {
    width: '100%',
  },
  primaryBtn: {
    backgroundColor: palette.amber,
    borderRadius: 999,
    paddingVertical: BTN_PAD_V,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  primaryBtnText: {
    color: palette.buttonInk,
    fontSize: BTN_FONT,
    fontWeight: '700',
  },
  giveUpBtn: {
    borderRadius: 999,
    paddingVertical: BTN_PAD_V,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,107,0.35)',
  },
  giveUpBtnText: {
    color: palette.danger,
    fontSize: BTN_FONT,
    fontWeight: '600',
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: SWATCH_ROW_H,
  },
  swatchWrap: {
    width: SWATCH,
    height: SWATCH,
  },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: SWATCH / 2,
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
    height: HINT_H,
    justifyContent: 'center',
  },
  footerHint: {
    color: palette.inkDim,
    fontSize: padSize(12),
    lineHeight: padSize(16),
    textAlign: 'center',
  },
});
