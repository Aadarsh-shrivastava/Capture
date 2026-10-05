import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { designTokens, radius } from '@/ui/designTokens';
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
        gap: 6,
        backgroundColor: designTokens.chip,
        borderRadius: radius.pill,
        paddingHorizontal: isSmall ? 10 : 12,
        paddingVertical: isSmall ? 5 : 7,
      }}
    >
      <Ionicons name={config.icon} size={isSmall ? 13 : 15} color={designTokens.textPrimary} />
      <Text
        style={{
          color: designTokens.textPrimary,
          fontSize: isSmall ? 12 : 13,
          fontWeight: '600',
          letterSpacing: 0.3,
        }}
      >
        {config.label}
      </Text>
    </View>
  );
}
