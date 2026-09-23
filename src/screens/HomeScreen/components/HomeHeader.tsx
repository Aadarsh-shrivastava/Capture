import { Text, View } from 'react-native';

import { designTokens, formatLongDate, getGreeting } from '@/ui/designTokens';

export function HomeHeader() {
  const now = new Date();

  return (
    <>
      <Text
        style={{
          color: designTokens.textPrimary,
          fontSize: 28,
          fontWeight: '600',
          letterSpacing: -0.4,
          marginBottom: 6,
        }}
      >
        {getGreeting(now)}
      </Text>
      <Text
        style={{
          color: designTokens.textSecondary,
          fontSize: 15,
          marginBottom: 28,
        }}
      >
        {formatLongDate(now)}
      </Text>
    </>
  );
}
