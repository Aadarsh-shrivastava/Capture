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
        marginTop: 26,
        marginBottom: 10,
      }}
    >
      <Text
        style={{
          color: designTokens.textSecondary,
          fontSize: 14,
          fontWeight: '600',
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
