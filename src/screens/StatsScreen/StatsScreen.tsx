import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useThemeStore } from '@/store/themeStore';

export function StatsScreen() {
  const { theme } = useThemeStore();
  const { colors, typography } = theme;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Text
        style={{
          color: colors.onSurface,
          fontSize: typography.headlineMd.fontSize,
          fontWeight: typography.headlineMd.fontWeight,
          padding: theme.spacing.marginMobile,
        }}
      >
        Stats
      </Text>
    </SafeAreaView>
  );
}
