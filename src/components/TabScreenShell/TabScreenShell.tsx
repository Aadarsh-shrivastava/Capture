import {Ionicons} from '@expo/vector-icons';
import type {ReactNode} from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {LargeHeader} from '@/components/LargeHeader/LargeHeader';
import {useThemeStore} from '@/store/themeStore';

type TabScreenShellProps = {
  title: string;
  children: ReactNode;
  action?: HeaderAction;
  secondaryAction?: HeaderAction;
  titleNode?: ReactNode;
};

type HeaderAction = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

export function TabScreenShell({title, children, action, secondaryAction, titleNode}: TabScreenShellProps) {
  const {theme} = useThemeStore();
  const navigation = useNavigation();
  const pushed = navigation.getState()?.type === 'stack';
  // Inset from the provider, not SafeAreaView: that one measures after the first frame, so pushed screens jumped down.
  const insets = useSafeAreaInsets();

  return (
    <View style={{flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top}}>
      <LargeHeader title={title} action={action} secondaryAction={secondaryAction} titleNode={titleNode} onBack={pushed ? navigation.goBack : undefined} />
      <View style={{flex: 1}}>{children}</View>
    </View>
  );
}
