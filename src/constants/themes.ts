import { FlameColors, LIVE_COLORS } from '@/components/flame';

export type ThemeId = 'ember' | 'verdant' | 'glacier' | 'amethyst';

export interface Theme {
  id: ThemeId;
  name: string;
  accent: string;
  accentDeep: string;
  buttonInk: string;
  flame: FlameColors;
}

export const THEMES: Record<ThemeId, Theme> = {
  ember: {
    id: 'ember',
    name: 'Ember',
    accent: '#FFB648',
    accentDeep: '#E8542F',
    buttonInk: '#221407',
    flame: LIVE_COLORS,
  },
  verdant: {
    id: 'verdant',
    name: 'Verdant',
    accent: '#6FDD8C',
    accentDeep: '#1E9E5C',
    buttonInk: '#0A2A15',
    flame: {
      bodyTop: '#C4F286',
      bodyMid: '#57CE72',
      bodyBottom: '#1FA35C',
      innerTop: '#F0FFCE',
      innerBottom: '#A3EA75',
      face: '#123B22',
      cheek: '#4CC96A',
      glow: '#57CE72',
    },
  },
  glacier: {
    id: 'glacier',
    name: 'Glacier',
    accent: '#5FD4F2',
    accentDeep: '#1F7FB8',
    buttonInk: '#06222E',
    flame: {
      bodyTop: '#B3EEFF',
      bodyMid: '#4EC5E8',
      bodyBottom: '#1F86C2',
      innerTop: '#E8FBFF',
      innerBottom: '#93E1F5',
      face: '#0B3346',
      cheek: '#3FB9DE',
      glow: '#4EC5E8',
    },
  },
  amethyst: {
    id: 'amethyst',
    name: 'Amethyst',
    accent: '#BB8CF6',
    accentDeep: '#7A3BD6',
    buttonInk: '#1C0E36',
    flame: {
      bodyTop: '#E3C8FF',
      bodyMid: '#AB70F0',
      bodyBottom: '#7C3ED8',
      innerTop: '#F6ECFF',
      innerBottom: '#CFA4F8',
      face: '#2E1354',
      cheek: '#9C64E8',
      glow: '#AB70F0',
    },
  },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];
