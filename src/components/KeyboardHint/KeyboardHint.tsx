import { Text } from '@/components/ui/text';
import { useThemeStore } from '@/store/themeStore';

type KeyboardHintProps = {
  keyLabel: string;
  action: string;
};

export function KeyboardHint({ keyLabel, action }: KeyboardHintProps) {
  const { theme } = useThemeStore();
  const { colors, spacing, rounded, typography } = theme;

  return (
    <Text
      style={{
        color: colors.onSurfaceVariant,
        fontSize: typography.labelSm.fontSize,
        textAlign: 'center',
        marginTop: spacing.stackLg,
      }}
    >
      Press{' '}
      <Text
        style={{
          color: colors.onSurface,
          fontSize: typography.labelSm.fontSize,
          backgroundColor: colors.surfaceContainerHigh,
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: rounded.sm,
          overflow: 'hidden',
        }}
      >
        {keyLabel}
      </Text>{' '}
      {action}
    </Text>
  );
}
