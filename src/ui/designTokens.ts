import Storage from 'expo-sqlite/kv-store';

/** Colour roles: `black` is the page, `white` the strongest foreground (text and fills on top of it). */
const dark = {
  accent: '#f5f5f5',
  accentMuted: 'rgba(255, 255, 255, 0.1)',
  accentSoft: 'rgba(255, 255, 255, 0.22)',
  white: '#ffffff',
  black: '#0a0a0a',
  surface: '#131313',
  surfaceRaised: '#1a1a1a',
  surfaceBorder: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#f5f5f5',
  textSecondary: '#a1a1a1',
  textTertiary: '#6b6b6b',
  heatEmpty: 'rgba(255, 255, 255, 0.06)',
  heatLow: 'rgba(255, 255, 255, 0.12)',
  heatMid: 'rgba(255, 255, 255, 0.28)',
  heatHigh: 'rgba(255, 255, 255, 0.48)',

  /** Card / sheet surfaces used by the product design. */
  card: '#171717',
  cardPressed: '#1f1f1f',
  sheet: '#121212',
  chip: 'rgba(255, 255, 255, 0.07)',
  divider: 'rgba(255, 255, 255, 0.07)',
  field: '#1c1c1c',

  /** Soft top-left light over `card` (RN new-arch native gradient; `card` stays as the fallback colour). */
  cardGradient: 'linear-gradient(160deg, #232323 0%, #171717 55%, #111111 100%)',
  cardShadow: '0 10px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  /** The big Now / come-back card: deeper than a plain card. */
  heroShadow: '0 24px 48px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
};

export type Palette = Record<keyof typeof dark, string>;

const light: Palette = {
  accent: '#141414',
  accentMuted: 'rgba(0, 0, 0, 0.06)',
  accentSoft: 'rgba(0, 0, 0, 0.16)',
  white: '#141414',
  black: '#f6f5f2',
  surface: '#ffffff',
  surfaceRaised: '#ffffff',
  surfaceBorder: 'rgba(0, 0, 0, 0.09)',
  textPrimary: '#141414',
  textSecondary: '#5a5a5a',
  textTertiary: '#8c8c8c',
  heatEmpty: 'rgba(0, 0, 0, 0.05)',
  heatLow: 'rgba(0, 0, 0, 0.12)',
  heatMid: 'rgba(0, 0, 0, 0.28)',
  heatHigh: 'rgba(0, 0, 0, 0.5)',
  card: '#ffffff',
  cardPressed: '#efeeea',
  sheet: '#ffffff',
  chip: 'rgba(0, 0, 0, 0.05)',
  divider: 'rgba(0, 0, 0, 0.07)',
  field: '#efeeea',
  cardGradient: 'linear-gradient(160deg, #ffffff 0%, #fbfaf8 55%, #f2f1ed 100%)',
  cardShadow: '0 8px 20px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
  heroShadow: '0 14px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
};

const midnight: Palette = {
  accent: '#e6ecff',
  accentMuted: 'rgba(180, 200, 255, 0.1)',
  accentSoft: 'rgba(180, 200, 255, 0.22)',
  white: '#f2f5ff',
  black: '#0b1020',
  surface: '#10172a',
  surfaceRaised: '#151d33',
  surfaceBorder: 'rgba(180, 200, 255, 0.1)',
  textPrimary: '#e8edff',
  textSecondary: '#9aa6c4',
  textTertiary: '#66718f',
  heatEmpty: 'rgba(180, 200, 255, 0.06)',
  heatLow: 'rgba(180, 200, 255, 0.14)',
  heatMid: 'rgba(180, 200, 255, 0.3)',
  heatHigh: 'rgba(180, 200, 255, 0.5)',
  card: '#131b30',
  cardPressed: '#1a2340',
  sheet: '#0f1628',
  chip: 'rgba(180, 200, 255, 0.08)',
  divider: 'rgba(180, 200, 255, 0.08)',
  field: '#18213a',
  cardGradient: 'linear-gradient(160deg, #1d2742 0%, #131b30 55%, #0e1426 100%)',
  cardShadow: '0 10px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  heroShadow: '0 24px 48px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
};

export const PALETTES = {dark, light, midnight} as const;
export type PaletteName = keyof typeof PALETTES;
export const PALETTE_LABELS: Record<PaletteName, string> = {dark: 'Dark', light: 'Light', midnight: 'Midnight'};

const THEME_KEY = 'appearance.theme';
const saved = Storage.getItemSync(THEME_KEY) as PaletteName | null;
export const initialPalette: PaletteName = saved && saved in PALETTES ? saved : 'dark';

/**
 * The current palette. Read at render time everywhere, so switching swaps its values in place and the app
 * remounts (see themeStore). Set before the first render from the saved choice.
 */
export const designTokens: Palette = {...PALETTES[initialPalette]};

export function applyPalette(name: PaletteName): void {
  Object.assign(designTokens, PALETTES[name]);
  Storage.setItemSync(THEME_KEY, name);
}

/** Corner radii used across the redesigned surfaces. */
export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

/** Shared type ramp for the redesigned screens. */
export const typeScale = {
  screenTitle: { fontSize: 34, fontWeight: '700' as const, letterSpacing: -0.8 },
  itemTitle: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.6 },
  sheetTitle: { fontSize: 17, fontWeight: '600' as const },
  cardTitle: { fontSize: 17, fontWeight: '600' as const },
  rowTitle: { fontSize: 16, fontWeight: '500' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
} as const;

export function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export { formatLongDate, formatRelativeDay } from '@/ui/formatDateTime';
