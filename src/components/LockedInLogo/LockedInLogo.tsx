import { Text, View } from 'react-native';

import { useThemeStore } from '@/store/themeStore';

type LockedInLogoProps = {
  size?: number;
};

export function LockedInLogo({ size = 22 }: LockedInLogoProps) {
  const { theme } = useThemeStore();
  const { colors } = theme;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text
        style={{
          fontSize: size,
          fontWeight: '700',
          color: colors.primaryContainer,
          letterSpacing: -0.3,
        }}
      >
        Locked
      </Text>
      <View
        style={{
          marginLeft: 1,
          backgroundColor: colors.primaryContainer,
          borderRadius: 4,
          paddingHorizontal: 5,
          paddingVertical: 1,
        }}
      >
        <Text
          style={{
            fontSize: size,
            fontWeight: '700',
            color: colors.onPrimary,
            letterSpacing: -0.3,
          }}
        >
          in
        </Text>
      </View>
    </View>
  );
}
