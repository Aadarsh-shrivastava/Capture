import {Ionicons} from '@expo/vector-icons';
import type {ReactNode} from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {LargeHeader} from '@/components/LargeHeader/LargeHeader';
import {useThemeStore} from '@/store/themeStore';

type TabScreenShellProps = {
  title: string;
  children: ReactNode;
  action?: HeaderAction;
  secondaryAction?: HeaderAction;
};

type HeaderAction = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

export function TabScreenShell({title, children, action, secondaryAction}: TabScreenShellProps) {
  const {theme} = useThemeStore();
  const navigation = useNavigation();
  const pushed = navigation.getState()?.type === 'stack';

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: theme.colors.background}}
      edges={['top']}>
      <LargeHeader title={title} action={action} secondaryAction={secondaryAction} onBack={pushed ? navigation.goBack : undefined} />
      <View style={{flex: 1}}>{children}</View>
    </SafeAreaView>
  );
}
