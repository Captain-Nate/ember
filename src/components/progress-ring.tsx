import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { palette } from '@/constants/palette';

interface ProgressRingProps {
  size: number;
  strokeWidth?: number;
  progress: number; // 0..1
  from?: string;
  to?: string;
  children?: ReactNode;
}

export function ProgressRing({
  size,
  strokeWidth = 12,
  progress,
  from = palette.amber,
  to = palette.emberDeep,
  children,
}: ProgressRingProps) {
  const c = size / 2;
  const r = c - strokeWidth / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Circle cx={c} cy={c} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth} fill="none" />
        {clamped > 0 && (
          <Circle
            cx={c}
            cy={c}
            r={r}
            stroke="url(#ring)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={circumference * (1 - clamped)}
            transform={`rotate(-90 ${c} ${c})`}
          />
        )}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
