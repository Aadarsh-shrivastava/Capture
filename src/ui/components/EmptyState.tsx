import { Text, View } from 'react-native';

import { designTokens } from '@/ui/designTokens';

type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <View style={{ paddingVertical: 32, paddingHorizontal: 8 }}>
      <Text
        style={{
          color: designTokens.textSecondary,
          fontSize: 16,
          lineHeight: 24,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
    </View>
  );
}
