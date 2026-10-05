export const designTokens = {
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
} as const;

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
