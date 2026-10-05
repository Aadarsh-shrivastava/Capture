import { StyleSheet } from 'react-native';

import { useThemeStore } from '@/store/themeStore';

export const appUi = {
  accent: '#e5e5e5',
};

export function useAppStyles() {
  const { theme } = useThemeStore();
  const { colors, spacing, rounded, typography } = theme;

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: spacing.marginMobile,
      paddingTop: spacing.stackMd,
      paddingBottom: spacing.stackLg,
    },
    title: {
      color: colors.onSurface,
      fontSize: typography.headlineLgMobile.fontSize,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    subtitle: {
      color: colors.onSurfaceVariant,
      fontSize: typography.bodyMd.fontSize,
      marginTop: spacing.stackSm,
    },
    sectionLabel: {
      color: colors.onSurfaceVariant,
      fontSize: typography.labelSm.fontSize,
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: spacing.stackSm,
      marginTop: spacing.stackLg,
    },
    row: {
      paddingVertical: spacing.stackMd,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowTitle: {
      color: colors.onSurface,
      fontSize: typography.bodyMd.fontSize,
      fontWeight: '500',
    },
    rowMeta: {
      color: colors.onSurfaceVariant,
      fontSize: typography.labelSm.fontSize,
      marginTop: 4,
    },
    primaryButton: {
      backgroundColor: appUi.accent,
      borderRadius: rounded.lg,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: spacing.stackMd,
    },
    primaryButtonText: {
      color: '#ffffff',
      fontSize: typography.labelMd.fontSize,
      fontWeight: '600',
    },
    secondaryButton: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: rounded.lg,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: spacing.stackSm,
    },
    secondaryButtonText: {
      color: colors.onSurface,
      fontSize: typography.labelMd.fontSize,
      fontWeight: '500',
    },
    input: {
      color: colors.onSurface,
      fontSize: typography.bodyMd.fontSize,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      paddingVertical: spacing.stackMd,
      marginBottom: spacing.stackMd,
    },
    multilineInput: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    chip: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: rounded.full,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
      marginBottom: 8,
    },
    chipActive: {
      borderColor: appUi.accent,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    chipText: {
      color: colors.onSurfaceVariant,
      fontSize: typography.labelSm.fontSize,
    },
    chipTextActive: {
      color: colors.onSurface,
      fontWeight: '600',
    },
    emptyText: {
      color: colors.onSurfaceVariant,
      fontSize: typography.bodyMd.fontSize,
      marginTop: spacing.stackMd,
    },
    errorText: {
      color: '#b0b0b0',
      fontSize: typography.labelSm.fontSize,
      marginTop: spacing.stackSm,
    },
  });
}
