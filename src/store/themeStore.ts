import { create } from 'zustand';

import { forgeControlTheme } from '@/theme/forgeControl';
import type { Theme } from '@/theme/types';

const themes: Record<string, Theme> = {
  'forge-control': forgeControlTheme,
};

type ThemeState = {
  themeName: string;
  theme: Theme;
  setTheme: (name: string) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  themeName: 'forge-control',
  theme: forgeControlTheme,
  setTheme: (name) => {
    const nextTheme = themes[name];
    if (!nextTheme) return;
    set({ themeName: name, theme: nextTheme });
  },
}));
