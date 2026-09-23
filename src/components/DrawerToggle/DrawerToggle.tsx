import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { useDrawerStore } from '@/store/drawerStore';
import { useThemeStore } from '@/store/themeStore';

type DrawerToggleProps = {
  color?: string;
};

export function DrawerToggle({ color }: DrawerToggleProps) {
  const toggle = useDrawerStore((state) => state.toggle);
  const { theme } = useThemeStore();
  const iconColor = color ?? theme.colors.onSurface;

  return (
    <Pressable onPress={toggle} hitSlop={12} accessibilityRole="button" accessibilityLabel="Open menu">
      <Ionicons name="menu-outline" size={24} color={iconColor} />
    </Pressable>
  );
}
