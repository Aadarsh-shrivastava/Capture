import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';

import { Pressable } from '@/ui/HapticPressable';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { useDrawerStore } from '@/store/drawerStore';
import { useThemeStore } from '@/store/themeStore';

export function DrawerProfile() {
  const router = useRouter();
  const close = useDrawerStore((state) => state.close);
  const { theme } = useThemeStore();
  const { colors, spacing, rounded, typography } = theme;

  function goToProfile() {
    close();
    router.push('/(tabs)/profile');
  }

  return (
    <Pressable
      onPress={goToProfile}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.stackMd,
        paddingVertical: spacing.stackMd,
        marginBottom: spacing.stackMd,
      }}
    >
      <Box
        style={{
          width: 48,
          height: 48,
          borderRadius: rounded.full,
          backgroundColor: colors.surfaceContainerHighest,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="person-outline" size={22} color={colors.onSurface} />
      </Box>

      <Box style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.onSurface,
            fontSize: typography.bodyLg.fontSize,
            fontWeight: '600',
          }}
        >
          Aadarsh
        </Text>
        <Text
          style={{
            color: colors.onSurfaceVariant,
            fontSize: typography.labelSm.fontSize,
            marginTop: 2,
          }}
        >
          View profile
        </Text>
      </Box>

    </Pressable>
  );
}
