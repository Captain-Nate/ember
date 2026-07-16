import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';

import { THEMES, ThemeId } from '@/constants/themes';
import { CandleTier, tierForMinutes } from '@/lib/session-log';

const TIER_SIZE: Record<CandleTier, { w: number; h: number }> = {
  tealight: { w: 40, h: 20 },
  votive: { w: 30, h: 36 },
  standard: { w: 28, h: 54 },
  pillar: { w: 30, h: 74 },
  grand: { w: 34, h: 92 },
};

interface CandleProps {
  themeId: ThemeId;
  minutes?: number;
  snuffed?: boolean;
  /** rendered height in px; the drawing is bottom-aligned inside a 56x124 viewBox */
  height?: number;
}

export function Candle({ themeId, minutes = 25, snuffed = false, height = 124 }: CandleProps) {
  const width = (56 / 124) * height;
  const theme = THEMES[themeId] ?? THEMES.ember;
  const f = theme.flame;
  const baseY = 120;

  if (snuffed) {
    return (
      <Svg width={width} height={height} viewBox="0 0 56 124">
        <Path
          d="M14 120 L14 112 Q14 104 20 104 Q22 96 28 100 Q34 94 38 102 Q42 104 42 110 L42 120 Z"
          fill="#4A4F60"
        />
        <Ellipse cx={28} cy={103} rx={8.5} ry={3.2} fill="#5C6274" />
        <Line x1={28} y1={103} x2={29.5} y2={97} stroke="#2E3242" strokeWidth={2.5} strokeLinecap="round" />
        <Path
          d="M30 91 Q24 83 30 75 Q36 67 30 59"
          stroke="#6E7484"
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
          opacity={0.5}
        />
      </Svg>
    );
  }

  const { w, h } = TIER_SIZE[tierForMinutes(minutes)];
  const x = 28 - w / 2;
  const topY = baseY - h;

  return (
    <Svg width={width} height={height} viewBox="0 0 56 124">
      <Circle cx={28} cy={topY - 12} r={13} fill={f.glow} opacity={0.22} />
      <Rect x={x} y={topY} width={w} height={h} rx={5} fill={theme.accent} />
      <Rect x={x + w - 9} y={topY + 3} width={5} height={13} rx={2.5} fill={f.innerBottom} opacity={0.9} />
      <Ellipse cx={28} cy={topY} rx={w / 2} ry={3.5} fill={f.innerBottom} />
      <Line x1={28} y1={topY - 1} x2={28} y2={topY - 6} stroke={f.face} strokeWidth={2} strokeLinecap="round" />
      <Path
        d={`M28 ${topY - 22} C 25.5 ${topY - 16} 23 ${topY - 14} 23 ${topY - 10.5} C 23 ${topY - 7} 25.2 ${topY - 5} 28 ${topY - 5} C 30.8 ${topY - 5} 33 ${topY - 7} 33 ${topY - 10.5} C 33 ${topY - 14} 30.5 ${topY - 16} 28 ${topY - 22} Z`}
        fill={f.bodyMid}
      />
      <Ellipse cx={28} cy={topY - 9} rx={3} ry={4} fill={f.innerTop} />
    </Svg>
  );
}
