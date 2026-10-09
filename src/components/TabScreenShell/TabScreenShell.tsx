import {Ionicons} from '@expo/vector-icons';
import type {ReactNode} from 'react';
import {View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {LargeHeader} from '@/components/LargeHeader/LargeHeader';
import {useThemeStore} from '@/store/themeStore';

type TabScreenShellProps = {
  title: string;
  children: ReactNode;
  action?: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
  };
};

export function TabScreenShell({title, children, action}: TabScreenShellProps) {
  const {theme} = useThemeStore();

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: theme.colors.background}}
      edges={['top']}>
      <LargeHeader title={title} action={action} />
      <View style={{flex: 1}}>{children}</View>
    </SafeAreaView>
  );
}
