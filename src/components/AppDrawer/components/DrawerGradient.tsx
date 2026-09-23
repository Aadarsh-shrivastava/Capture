import { View } from 'react-native';

import { useThemeStore } from '@/store/themeStore';

export function DrawerGradient() {
  const { theme } = useThemeStore();
  const { colors } = theme;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.surfaceContainerLow,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '70%',
          height: '45%',
          backgroundColor: colors.primaryContainer,
          opacity: 0.12,
          borderBottomLeftRadius: 120,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '55%',
          backgroundColor: colors.surfaceContainerHigh,
          opacity: 0.35,
        }}
      />
    </View>
  );
}
