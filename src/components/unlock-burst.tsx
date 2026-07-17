import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

const PARTICLE_COUNT = 16;
const DURATION_MS = 1100;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface UnlockBurstProps {
  colors: string[];
  onDone: () => void;
}

interface Particle {
  angle: number;
  distance: number;
  size: number;
  color: string;
}

/** One-shot sparkle burst for a completed theme unlock. Unmounts itself via onDone. */
export function UnlockBurst({ colors, onDone }: UnlockBurstProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const particles = useRef<Particle[]>(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      angle: (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.5,
      distance: 110 + Math.random() * 70,
      size: 6 + Math.random() * 7,
      color: colors[i % colors.length],
    })),
  ).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start(({ finished }) => {
      // A superseded animation (e.g. StrictMode double-mount) also invokes this
      // callback — only a genuine finish should dismiss the celebration.
      if (finished) onDone();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const opacity = progress.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [1, 1, 0],
  });
  const ringScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.5] });

  return (
    <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
      <Animated.View
        style={[
          styles.ring,
          { borderColor: colors[0], opacity, transform: [{ scale: ringScale }] },
        ]}
      />
      {particles.map((p, i) => {
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(p.angle) * p.distance],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(p.angle) * p.distance],
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.15, 1],
          outputRange: [0, 1, 0.4],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: p.color,
                opacity,
                transform: [{ translateX }, { translateY }, { scale }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 3,
  },
  particle: {
    position: 'absolute',
  },
});
