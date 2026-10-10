import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Pressable } from '@/ui/HapticPressable';
import { designTokens } from '@/ui/designTokens';

type QuickAccessTileProps = {
  label: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

export function QuickAccessTile({ label, count, icon, onPress }: QuickAccessTileProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: '47%',
        borderWidth: 1,
        borderColor: designTokens.surfaceBorder,
        backgroundColor: designTokens.surfaceRaised,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 10,
      }}
    >
      <Ionicons name={icon} size={16} color={designTokens.textSecondary} />
      <Text
        style={{
          color: designTokens.textPrimary,
          fontSize: 15,
          fontWeight: '600',
          marginTop: 10,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: designTokens.textTertiary,
          fontSize: 13,
          marginTop: 2,
        }}
      >
        {count}
      </Text>
    </Pressable>
  );
}
