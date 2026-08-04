import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Candle } from '@/components/candle';
import { CONTENT_MAX_WIDTH, HEADER_TOP_PAD, padSize } from '@/constants/layout';
import { palette } from '@/constants/palette';
import { loadSessions, SessionRecord } from '@/lib/session-log';

const COLUMNS = 4;

export default function CollectionScreen() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadSessions().then((all) => setSessions([...all].reverse()));
    }, []),
  );

  const lit = sessions.filter((s) => s.outcome === 'completed').length;
  const snuffed = sessions.length - lit;

  const rows: SessionRecord[][] = [];
  for (let i = 0; i < sessions.length; i += COLUMNS) {
    rows.push(sessions.slice(i, i + COLUMNS));
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Candles</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.summary}>
        {sessions.length === 0
          ? 'Nothing on the shelf yet'
          : `${lit} lit${snuffed > 0 ? ` · ${snuffed} snuffed` : ''}`}
      </Text>

      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Finish a focus session and the flame will light your first candle.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {rows.map((row, i) => (
            <View key={i} style={styles.shelfBlock}>
              <View style={styles.row}>
                {row.map((s, j) => (
                  <View key={j} style={styles.cell}>
                    <Candle
                      themeId={s.themeId}
                      minutes={s.durationMin}
                      snuffed={s.outcome === 'doused'}
                      height={104}
                    />
                  </View>
                ))}
                {row.length < COLUMNS &&
                  Array.from({ length: COLUMNS - row.length }).map((_, j) => (
                    <View key={`pad-${j}`} style={styles.cell} />
                  ))}
              </View>
              <View style={styles.shelf} />
            </View>
          ))}
        </ScrollView>
      )}
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
  summary: {
    color: palette.inkDim,
    fontSize: padSize(14),
    textAlign: 'center',
    marginTop: 14,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: palette.inkDim,
    fontSize: padSize(15),
    textAlign: 'center',
    lineHeight: 22,
  },
  grid: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 40,
  },
  shelfBlock: {
    marginBottom: 22,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  shelf: {
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
});
