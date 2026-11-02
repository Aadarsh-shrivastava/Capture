import type {Ionicons} from '@expo/vector-icons';

export type ViewKey = 'today' | 'week' | 'month';

/** Focus modes, picked from the header title. `days` = how far ahead the agenda reaches (Today is Focus's own body). */
export const VIEWS: {key: ViewKey; label: string; icon: keyof typeof Ionicons.glyphMap; days: number}[] = [
  {key: 'today', label: 'Today', icon: 'sunny-outline', days: 1},
  {key: 'week', label: 'This week', icon: 'calendar-outline', days: 7},
  {key: 'month', label: 'This month', icon: 'calendar-number-outline', days: 30},
];
