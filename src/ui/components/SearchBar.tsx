import { Ionicons } from '@expo/vector-icons';
import type { Ref } from 'react';
import { TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { designTokens, radius } from '@/ui/designTokens';
import { Pressable } from '@/ui/HapticPressable';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  inputRef?: Ref<TextInput>;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search items',
  autoFocus,
  style,
  inputRef,
}: SearchBarProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: designTokens.field,
          borderRadius: radius.md,
          paddingHorizontal: 14,
          height: 46,
          marginBottom: 16,
        },
        style,
      ]}
    >
      <Ionicons name="search" size={16} color={designTokens.textTertiary} />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={designTokens.textTertiary}
        autoFocus={autoFocus}
        returnKeyType="search"
        style={{ flex: 1, color: designTokens.textPrimary, fontSize: 15 }}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={18} color={designTokens.textTertiary} />
        </Pressable>
      ) : null}
    </View>
  );
}
