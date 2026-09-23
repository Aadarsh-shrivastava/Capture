import { Text } from '@/components/ui/text';
import { useThemeStore } from '@/store/themeStore';

type SectionLabelProps = {
  label: string;
};

export function SectionLabel({ label }: SectionLabelProps) {
  const { theme } = useThemeStore();
  const { colors, typography } = theme;

  return (
    <Text
      style={{
        color: colors.onSurfaceVariant,
        fontSize: typography.labelSm.fontSize,
        fontWeight: '600',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: theme.spacing.stackMd,
      }}
    >
      {label}
    </Text>
  );
}
