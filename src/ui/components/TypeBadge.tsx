import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { getItemTypeConfig } from '@/ui/itemTypeConfig';

type TypeBadgeProps = {
  typeName: string;
  size?: 'sm' | 'md';
};

export function TypeBadge({ typeName, size = 'sm' }: TypeBadgeProps) {
  const config = getItemTypeConfig(typeName);
  const isSmall = size === 'sm';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        backgroundColor: config.accentMuted,
        borderRadius: 6,
        paddingHorizontal: isSmall ? 8 : 10,
        paddingVertical: isSmall ? 4 : 6,
      }}
    >
      <Ionicons name={config.icon} size={isSmall ? 12 : 14} color={config.accent} />
      <Text
        style={{
          color: config.accent,
          fontSize: isSmall ? 11 : 12,
          fontWeight: '600',
          letterSpacing: 0.3,
        }}
      >
        {config.label}
      </Text>
    </View>
  );
}
