import { Ionicons } from '@expo/vector-icons';
import { TextInput, View } from 'react-native';

import { designTokens, radius } from '@/ui/designTokens';

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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: designTokens.field,
        borderRadius: radius.md,
        paddingHorizontal: 14,
        height: 46,
        marginBottom: 16,
      }}
    >
      <Ionicons name="search" size={16} color={designTokens.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={designTokens.textTertiary}
        style={{ flex: 1, color: designTokens.textPrimary, fontSize: 15 }}
      />
    </View>
  );
}
