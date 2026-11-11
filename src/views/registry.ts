import type {Ionicons} from '@expo/vector-icons';

export type ViewKey = 'today' | 'tomorrow' | 'week' | 'month' | 'custom';

/** Focus modes, picked from the header title. `days` = how far ahead the agenda reaches (1 = Focus's own single-day body). */
export const VIEWS: {key: ViewKey; label: string; icon: keyof typeof Ionicons.glyphMap; days: number}[] = [
  {key: 'today', label: 'Today', icon: 'sunny-outline', days: 1},
  {key: 'tomorrow', label: 'Tomorrow', icon: 'partly-sunny-outline', days: 1},
  {key: 'week', label: 'This week', icon: 'calendar-outline', days: 7},
  {key: 'month', label: 'This month', icon: 'calendar-number-outline', days: 30},
  {key: 'custom', label: 'Custom date', icon: 'calendar-clear-outline', days: 1},
];
