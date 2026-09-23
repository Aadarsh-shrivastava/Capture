import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '@/components/ui/text';
import { useDrawerStore } from '@/store/drawerStore';
import { useThemeStore } from '@/store/themeStore';

type DrawerMenuItemProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
};

export function DrawerMenuItem({ label, icon, href }: DrawerMenuItemProps) {
  const router = useRouter();
  const close = useDrawerStore((state) => state.close);
  const { theme } = useThemeStore();
  const { colors, spacing, typography } = theme;

  function onPress() {
    close();
    router.push(href as never);
  }

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.stackMd,
        paddingVertical: spacing.stackMd,
      }}
    >
      <Ionicons name={icon} size={20} color={colors.onSurfaceVariant} />
      <Text
        style={{
          color: colors.onSurface,
          fontSize: typography.bodyMd.fontSize,
          fontWeight: '500',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
