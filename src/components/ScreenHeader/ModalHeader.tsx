import { Pressable } from 'react-native';

import { Box } from '@/components/ui/box';
import { CloseIcon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useThemeStore } from '@/store/themeStore';

type ModalHeaderProps = {
  title: string;
  subtitle?: string;
  onClose?: () => void;
};

export function ModalHeader({ title, subtitle, onClose }: ModalHeaderProps) {
  const { theme } = useThemeStore();
  const { colors, spacing, typography } = theme;

  return (
    <Box
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: spacing.stackLg,
      }}
    >
      <Box style={{ flex: 1, alignItems: 'center' }}>
        <Text
          style={{
            color: colors.onSurface,
            fontSize: typography.headlineLgMobile.fontSize,
            fontWeight: typography.headlineLgMobile.fontWeight,
            lineHeight: typography.headlineLgMobile.lineHeight,
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              color: colors.onSurfaceVariant,
              fontSize: typography.bodyMd.fontSize,
              lineHeight: typography.bodyMd.lineHeight,
              marginTop: spacing.stackSm,
              textAlign: 'center',
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </Box>

      {onClose ? (
        <Pressable
          hitSlop={12}
          onPress={onClose}
          style={{ position: 'absolute', right: 0, top: 0 }}
        >
          <CloseIcon width={20} height={20} color={colors.onSurfaceVariant} />
        </Pressable>
      ) : null}
    </Box>
  );
}
