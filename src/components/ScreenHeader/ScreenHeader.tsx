import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Pressable } from '@/ui/HapticPressable';
import { DrawerToggle } from '@/components/DrawerToggle/DrawerToggle';
import { designTokens } from '@/ui/designTokens';
import { useThemeStore } from '@/store/themeStore';

type ScreenHeaderProps = {
  title: string;
  right?: ReactNode;
  leading?: 'back' | 'drawer' | 'none' | ReactNode;
  onBack?: () => void;
};

function HeaderButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={12} accessibilityRole="button">
      <Text style={{ color: designTokens.accent, fontSize: 16, fontWeight: '500' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ScreenHeader({ title, right, leading = 'back', onBack }: ScreenHeaderProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { spacing } = theme;

  function renderLeading() {
    if (leading === 'none') {
      return <View style={{ width: 32 }} />;
    }

    if (leading === 'drawer') {
      return <DrawerToggle color={designTokens.textPrimary} />;
    }

    if (leading === 'back') {
      return (
        <Pressable
          onPress={onBack ?? (() => router.back())}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={designTokens.textPrimary} />
        </Pressable>
      );
    }

    return leading;
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: spacing.stackSm,
        paddingBottom: spacing.stackMd,
        backgroundColor: theme.colors.background,
      }}
    >
      <View style={{ minWidth: 48, alignItems: 'flex-start' }}>{renderLeading()}</View>

      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          color: designTokens.textPrimary,
          fontSize: 17,
          fontWeight: '600',
          textAlign: 'center',
          letterSpacing: -0.2,
        }}
      >
        {title}
      </Text>

      <View style={{ minWidth: 48, alignItems: 'flex-end' }}>{right ?? null}</View>
    </View>
  );
}

export { HeaderButton };
