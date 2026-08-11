import { FlameColors, LIVE_COLORS } from '@/components/flame';

export type ThemeId =
  | 'ember'
  | 'verdant'
  | 'glacier'
  | 'amethyst'
  | 'rose'
  | 'sapphire'
  | 'moonlight'
  | 'ruby';

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
  rose: {
    id: 'rose',
    name: 'Rose',
    accent: '#FB8CC3',
    accentDeep: '#C2276E',
    buttonInk: '#330B22',
    flame: {
      bodyTop: '#FFC9E0',
      bodyMid: '#F877B4',
      bodyBottom: '#D6367F',
      innerTop: '#FFEFF7',
      innerBottom: '#FBAFD4',
      face: '#4A1030',
      cheek: '#F06CA8',
      glow: '#F877B4',
    },
  },
  sapphire: {
    id: 'sapphire',
    name: 'Sapphire',
    accent: '#7C96FA',
    accentDeep: '#2E45D4',
    buttonInk: '#0C1440',
    flame: {
      bodyTop: '#9DBEFF',
      bodyMid: '#5B7BF7',
      bodyBottom: '#2E45D4',
      innerTop: '#E3ECFF',
      innerBottom: '#8FA8FB',
      face: '#101B4E',
      cheek: '#4C6BEB',
      glow: '#5B7BF7',
    },
  },
  moonlight: {
    id: 'moonlight',
    name: 'Moonlight',
    accent: '#D5DCE8',
    accentDeep: '#7A87A0',
    buttonInk: '#171B26',
    flame: {
      bodyTop: '#F4F6FA',
      bodyMid: '#C7CEDC',
      bodyBottom: '#8E99B0',
      innerTop: '#FFFFFF',
      innerBottom: '#DFE5EF',
      face: '#2A3040',
      cheek: '#AAB4C8',
      glow: '#C7CEDC',
    },
  },
  ruby: {
    id: 'ruby',
    name: 'Ruby',
    accent: '#F4525A',
    accentDeep: '#B00E1C',
    buttonInk: '#3D050B',
    flame: {
      bodyTop: '#FF867E',
      bodyMid: '#E8232E',
      bodyBottom: '#9E0B18',
      innerTop: '#FFE5E0',
      innerBottom: '#FF9C92',
      face: '#4A0A10',
      cheek: '#E0313C',
      glow: '#E8232E',
    },
  },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export const THEME_STORAGE_KEY = 'ember.theme.v1';
