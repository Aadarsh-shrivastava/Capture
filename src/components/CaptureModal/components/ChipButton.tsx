import { type ReactNode } from 'react';


import { Pressable } from '@/ui/HapticPressable';
import { Text } from '@/components/ui/text';
import { useThemeStore } from '@/store/themeStore';

type ChipButtonProps = {
  label: string;
  icon: ReactNode;
  onPress?: () => void;
};

export function ChipButton({ label, icon, onPress }: ChipButtonProps) {
  const { theme } = useThemeStore();
  const { colors, rounded, typography } = theme;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: '45%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: rounded.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceContainerLow,
      }}
    >
      {icon}
      <Text
        style={{
          color: colors.onSurface,
          fontSize: typography.labelMd.fontSize,
          fontWeight: typography.labelMd.fontWeight,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
