import { TextInput, View } from 'react-native';

import { designTokens } from '@/ui/designTokens';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search items',
}: SearchBarProps) {
  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: designTokens.surfaceBorder,
        marginTop: 20,
        marginBottom: 16,
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={designTokens.textTertiary}
        style={{
          color: designTokens.textPrimary,
          fontSize: 16,
          paddingVertical: 12,
        }}
      />
    </View>
  );
}
