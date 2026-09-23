export const designTokens = {
  accent: '#b84b3e',
  accentMuted: 'rgba(184, 75, 62, 0.14)',
  accentSoft: 'rgba(184, 75, 62, 0.35)',
  white: '#ffffff',
  black: '#0a0a0a',
  surface: '#131313',
  surfaceRaised: '#1a1a1a',
  surfaceBorder: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#f5f5f5',
  textSecondary: '#a1a1a1',
  textTertiary: '#6b6b6b',
  heatEmpty: 'rgba(255, 255, 255, 0.06)',
  heatLow: 'rgba(184, 75, 62, 0.18)',
  heatMid: 'rgba(184, 75, 62, 0.42)',
  heatHigh: 'rgba(184, 75, 62, 0.72)',
} as const;

export function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export { formatLongDate, formatRelativeDay } from '@/ui/formatDateTime';
