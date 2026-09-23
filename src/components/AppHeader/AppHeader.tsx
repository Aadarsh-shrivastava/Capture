import type { ReactNode } from 'react';
import { View } from 'react-native';

import { DrawerToggle } from '@/components/DrawerToggle/DrawerToggle';
import { LockedInLogo } from '@/components/LockedInLogo/LockedInLogo';
import { useThemeStore } from '@/store/themeStore';

type AppHeaderProps = {
  right?: ReactNode;
};

export function AppHeader({ right }: AppHeaderProps) {
  const { theme } = useThemeStore();
  const { colors, spacing } = theme;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.marginMobile,
        paddingTop: spacing.stackSm,
        paddingBottom: spacing.stackMd,
        backgroundColor: colors.background,
      }}
    >
        <DrawerToggle />
        <LockedInLogo />

      {right ? <View>{right}</View> : <View style={{ width: 24 }} />}
    </View>
  );
}
