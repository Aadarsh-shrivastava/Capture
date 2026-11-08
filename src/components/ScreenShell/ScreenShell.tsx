import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ScreenHeader/ScreenHeader';
import { useThemeStore } from '@/store/themeStore';

type ScreenShellProps = {
  title: string;
  children: ReactNode;
  right?: ReactNode;
  leading?: 'back' | 'drawer' | 'none' | ReactNode;
  onBack?: () => void;
};

export function ScreenShell({
  title,
  children,
  right,
  leading = 'back',
  onBack,
}: ScreenShellProps) {
  const { theme } = useThemeStore();
  // Inset from the provider, not SafeAreaView: that one measures after the first frame, so pushed screens jumped down.
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
      <ScreenHeader title={title} right={right} leading={leading} onBack={onBack} />
      {children}
    </View>
  );
}
