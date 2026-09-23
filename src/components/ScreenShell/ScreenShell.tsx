import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ScreenHeader title={title} right={right} leading={leading} onBack={onBack} />
      {children}
    </SafeAreaView>
  );
}
