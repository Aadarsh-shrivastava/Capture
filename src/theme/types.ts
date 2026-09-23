export type ThemeColors = {
  background: string;
  onBackground: string;
  surface: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  error: string;
  border: string;
  gridLine: string;
  placeholder: string;
};

export type ThemeTypography = {
  fontFamily: string;
  headlineXl: { fontSize: number; fontWeight: '800'; lineHeight: number; letterSpacing: number };
  headlineLg: { fontSize: number; fontWeight: '700'; lineHeight: number; letterSpacing: number };
  headlineLgMobile: { fontSize: number; fontWeight: '700'; lineHeight: number };
  headlineMd: { fontSize: number; fontWeight: '600'; lineHeight: number };
  bodyLg: { fontSize: number; fontWeight: '400'; lineHeight: number };
  bodyMd: { fontSize: number; fontWeight: '400'; lineHeight: number };
  labelMd: { fontSize: number; fontWeight: '600'; lineHeight: number; letterSpacing: number };
  labelSm: { fontSize: number; fontWeight: '500'; lineHeight: number; letterSpacing: number };
};

export type ThemeSpacing = {
  unit: number;
  gutter: number;
  marginMobile: number;
  stackSm: number;
  stackMd: number;
  stackLg: number;
};

export type ThemeRounded = {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
};

export type Theme = {
  name: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  rounded: ThemeRounded;
};
