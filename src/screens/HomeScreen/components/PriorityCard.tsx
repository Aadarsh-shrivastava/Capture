import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Pressable } from '@/ui/HapticPressable';
import { designTokens } from '@/ui/designTokens';

type ActiveSessionCardProps = {
  title?: string;
  meta?: string;
};

export function ActiveSessionCard({ title, meta }: ActiveSessionCardProps) {
  const router = useRouter();
  const isActive = Boolean(title);

  return (
    <View
      style={{
        backgroundColor: designTokens.surfaceRaised,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: designTokens.surfaceBorder,
        padding: 20,
        marginBottom: 28,
      }}
    >
      {isActive ? (
        <>
          <Text
            style={{
              color: designTokens.textTertiary,
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            ACTIVE
          </Text>
          <Text
            style={{
              color: designTokens.textPrimary,
              fontSize: 22,
              fontWeight: '600',
              lineHeight: 28,
              marginBottom: 8,
            }}
          >
            {title}
          </Text>
          {meta ? (
            <Text style={{ color: designTokens.textSecondary, fontSize: 14, marginBottom: 20 }}>
              {meta}
            </Text>
          ) : null}
          <Pressable
            onPress={() => router.push('/(tabs)/today')}
            style={{ alignSelf: 'flex-end' }}
          >
            <Text style={{ color: designTokens.accent, fontSize: 15, fontWeight: '600' }}>
              Continue →
            </Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text
            style={{
              color: designTokens.textTertiary,
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 1,
              marginBottom: 16,
            }}
          >
            NOTHING ACTIVE
          </Text>
          <Text
            style={{
              color: designTokens.textSecondary,
              fontSize: 15,
              lineHeight: 22,
              marginBottom: 20,
            }}
          >
            Choose something to work on
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/today')}
            style={{ alignSelf: 'flex-end' }}
          >
            <Text style={{ color: designTokens.accent, fontSize: 15, fontWeight: '600' }}>
              Start →
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
