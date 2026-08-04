import { Platform } from 'react-native';

// The app is designed as a phone-width column. On iPad (and any resized
// iPadOS window) every screen holds its content to this width and centres it,
// rather than stretching controls across the display.
export const CONTENT_MAX_WIDTH = 560;

export const IS_PAD = Platform.OS === 'ios' && Platform.isPad;

// iPadOS 26 draws the window-control cluster over the top-left of a windowed
// app. Every screen puts its header below that band so the controls never land
// on the wordmark or the back button.
export const HEADER_PAD_TOP = 10;
export const HEADER_PAD_TOP_PAD = 48;
export const HEADER_TOP_PAD = IS_PAD ? HEADER_PAD_TOP_PAD : HEADER_PAD_TOP;

// iPad is held further from the eye than a phone, so phone-sized type reads
// small on it. Every font and its surrounding padding goes through padSize()
// together — scaling text alone would burst the fixed-height control rows.
export const PAD_TEXT_SCALE = 1.45;
export const padSize = (n: number): number => (IS_PAD ? Math.round(n * PAD_TEXT_SCALE) : n);
export const lineHeightFor = (font: number): number => Math.round(font * 1.25);
