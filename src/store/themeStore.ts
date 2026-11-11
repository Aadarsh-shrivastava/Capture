import { create } from 'zustand';

import { forgeControlTheme } from '@/theme/forgeControl';
import type { Theme } from '@/theme/types';
import { applyPalette, designTokens, initialPalette, type PaletteName } from '@/ui/designTokens';

/** The shared theme with its main colours taken from the current palette. */
function themeFor(): Theme {
  const t = designTokens;
  return {
    ...forgeControlTheme,
    colors: {
      ...forgeControlTheme.colors,
      background: t.black,
      onBackground: t.textPrimary,
      surface: t.surface,
      surfaceDim: t.black,
      surfaceBright: t.cardPressed,
      // Every surface role from the palette, so nothing (e.g. the side menu) stays dark in Light.
      surfaceContainerLowest: t.black,
      surfaceContainerLow: t.sheet,
      surfaceContainer: t.surfaceRaised,
      surfaceContainerHigh: t.field,
      surfaceContainerHighest: t.cardPressed,
      outline: t.textTertiary,
      outlineVariant: t.divider,
      placeholder: t.textTertiary,
      gridLine: t.divider,
      onSurface: t.textPrimary,
      onSurfaceVariant: t.textSecondary,
      primary: t.accent,
      onPrimary: t.black,
      primaryContainer: t.accent,
      border: t.surfaceBorder,
    },
  };
}

type ThemeState = {
  themeName: PaletteName;
  theme: Theme;
  setTheme: (name: PaletteName) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  themeName: initialPalette,
  theme: themeFor(),
  setTheme: (name) => {
    applyPalette(name);
    set({ themeName: name, theme: themeFor() });
  },
}));

/** Light palette = dark status bar text, gluestack light mode. */
export const isLightTheme = (name: PaletteName) => name === 'light';
