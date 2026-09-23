import { Text, View } from 'react-native';

import { designTokens } from '@/ui/designTokens';

type SectionHeaderProps = {
  label: string;
  trailing?: string;
};

export function SectionHeader({ label, trailing }: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginTop: 28,
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          color: designTokens.textSecondary,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 1.1,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      {trailing ? (
        <Text style={{ color: designTokens.textTertiary, fontSize: 12 }}>{trailing}</Text>
      ) : null}
    </View>
  );
}
