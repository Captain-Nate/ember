import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

export type FlameMood = 'idle' | 'focused' | 'happy' | 'doused';

interface FlameProps {
  mood: FlameMood;
  size?: number;
  /** theme colors for the living flame; doused always renders gray */
  colors?: FlameColors;
}

const HAPPY_SWELL = 1.08;

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export interface FlameColors {
  bodyTop: string;
  bodyMid: string;
  bodyBottom: string;
  innerTop: string;
  innerBottom: string;
  face: string;
  cheek: string;
  glow: string;
}

export const LIVE_COLORS: FlameColors = {
  bodyTop: '#FFD97A',
  bodyMid: '#FF9C3F',
  bodyBottom: '#F2552C',
  innerTop: '#FFF3C2',
  innerBottom: '#FFC95B',
  face: '#46220E',
  cheek: '#FF8A4D',
  glow: '#FF9C3F',
};

const DOUSED_COLORS: FlameColors = {
  bodyTop: '#6A7183',
  bodyMid: '#565D70',
  bodyBottom: '#474D5F',
  innerTop: '#8A90A0',
  innerBottom: '#666C7C',
  face: '#2F3442',
  cheek: '#666C7C',
  glow: '#3B4152',
};

export function Flame({ mood, size = 160, colors: themeColors }: FlameProps) {
  const height = size * 1.2; // viewBox is 200 x 240
  const alive = mood !== 'doused';
  const colors = alive ? (themeColors ?? LIVE_COLORS) : DOUSED_COLORS;
  // Ember stays full size through the session (candles carry the reward arc);
  // completion gets a small celebratory swell.
  const grow = mood === 'happy' ? HAPPY_SWELL : 1;

  const flicker = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const [eyesClosed, setEyesClosed] = useState(false);

  useEffect(() => {
    const flickerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 1, duration: 260, easing: Easing.inOut(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(flicker, { toValue: 0.35, duration: 220, easing: Easing.inOut(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(flicker, { toValue: 0.85, duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(flicker, { toValue: 0, duration: 260, easing: Easing.inOut(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
    );
    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(sway, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(glowPulse, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
    );
    if (alive) {
      flickerLoop.start();
      swayLoop.start();
      glowLoop.start();
    }
    return () => {
      flickerLoop.stop();
      swayLoop.stop();
      glowLoop.stop();
      flicker.setValue(0);
      sway.setValue(0.5);
      glowPulse.setValue(0);
    };
  }, [alive, flicker, sway, glowPulse]);

  useEffect(() => {
    if (mood !== 'idle' && mood !== 'focused') return;
    const id = setInterval(() => {
      setEyesClosed(true);
      setTimeout(() => setEyesClosed(false), 130);
    }, 3400);
    return () => clearInterval(id);
  }, [mood]);

  // Squash-and-stretch pinned to the flame's base: scaleY happens about the
  // center, so shift up by half the added height to keep the bottom in place.
  const scaleY = flicker.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] });
  const scaleX = flicker.interpolate({ inputRange: [0, 1], outputRange: [1, 0.985] });
  const translateY = flicker.interpolate({ inputRange: [0, 1], outputRange: [0, -(0.045 / 2) * height] });
  const rotate = sway.interpolate({ inputRange: [0, 1], outputRange: ['-1.6deg', '1.6deg'] });
  const glowOpacity = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.85] });
  const glowScale = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.07] });

  const glowSize = size * 1.7;
  const eyeRy = eyesClosed ? 1.6 : mood === 'focused' ? 7 : 11;

  return (
    <View
      style={{
        width: size,
        height,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ translateY: (height * (1 - grow)) / 2 }, { scale: grow }],
      }}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            pointerEvents: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: alive ? glowOpacity : 0.25,
            transform: [{ scale: alive ? glowScale : 1 }],
          },
        ]}
      >
        <Svg width={glowSize} height={glowSize} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="55%" r="50%">
              <Stop offset="0%" stopColor={colors.glow} stopOpacity={0.55} />
              <Stop offset="70%" stopColor={colors.glow} stopOpacity={0.16} />
              <Stop offset="100%" stopColor={colors.glow} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={50} cy={50} r={50} fill="url(#glow)" />
        </Svg>
      </Animated.View>

      <Animated.View
        style={
          alive
            ? { transform: [{ translateY }, { scaleY }, { scaleX }, { rotate }] }
            : undefined
        }
      >
        <Svg width={size} height={height} viewBox="0 0 200 240">
          <Defs>
            <LinearGradient id="body" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.bodyTop} />
              <Stop offset="0.55" stopColor={colors.bodyMid} />
              <Stop offset="1" stopColor={colors.bodyBottom} />
            </LinearGradient>
            <LinearGradient id="inner" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.innerTop} />
              <Stop offset="1" stopColor={colors.innerBottom} />
            </LinearGradient>
          </Defs>

          {/* outer flame */}
          <Path
            d="M100 18 C96 60 42 96 42 156 C42 202 68 226 100 226 C132 226 158 202 158 156 C158 96 104 60 100 18 Z"
            fill="url(#body)"
          />
          {/* inner flame */}
          <Path
            d="M100 78 C97 104 66 122 66 162 C66 192 82 206 100 206 C118 206 134 192 134 162 C134 122 103 104 100 78 Z"
            fill="url(#inner)"
            opacity={0.9}
          />

          {/* face */}
          {mood === 'happy' ? (
            <>
              <Path d="M66 148 Q78 136 90 148" stroke={colors.face} strokeWidth={5.5} strokeLinecap="round" fill="none" />
              <Path d="M110 148 Q122 136 134 148" stroke={colors.face} strokeWidth={5.5} strokeLinecap="round" fill="none" />
              <Path d="M84 170 Q100 194 116 170 Z" fill="#7A3414" />
            </>
          ) : mood === 'doused' ? (
            <>
              <Path d="M70 140 L86 156 M86 140 L70 156" stroke={colors.face} strokeWidth={5} strokeLinecap="round" />
              <Path d="M114 140 L130 156 M130 140 L114 156" stroke={colors.face} strokeWidth={5} strokeLinecap="round" />
              <Path d="M86 186 Q100 174 114 186" stroke={colors.face} strokeWidth={5} strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              <Ellipse cx={78} cy={148} rx={7.5} ry={eyeRy} fill={colors.face} />
              <Ellipse cx={122} cy={148} rx={7.5} ry={eyeRy} fill={colors.face} />
              <Path d="M86 176 Q100 187 114 176" stroke={colors.face} strokeWidth={5} strokeLinecap="round" fill="none" />
            </>
          )}

          {(mood === 'idle' || mood === 'focused' || mood === 'happy') && (
            <>
              <Circle cx={64} cy={166} r={6} fill={colors.cheek} opacity={0.45} />
              <Circle cx={136} cy={166} r={6} fill={colors.cheek} opacity={0.45} />
            </>
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}
