import { useRouter } from 'expo-router';

import { Pressable } from '@/ui/HapticPressable';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { useDrawerStore } from '@/store/drawerStore';
import { Avatar, useProfileStore } from '@/profile';
import { useThemeStore } from '@/store/themeStore';

export function DrawerProfile() {
  const router = useRouter();
  const close = useDrawerStore((state) => state.close);
  const { theme } = useThemeStore();
  const { colors, spacing, typography } = theme;
  const profile = useProfileStore();

  function goToProfile() {
    close();
    router.push('/profile');
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
      <Avatar size={48} />

      <Box style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.onSurface,
            fontSize: typography.bodyLg.fontSize,
            fontWeight: '600',
          }}
        >
          {profile.name || 'Your profile'}
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
