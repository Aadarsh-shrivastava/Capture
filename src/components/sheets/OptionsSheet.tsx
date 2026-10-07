import {Ionicons} from '@expo/vector-icons';
import {Text, View} from 'react-native';

import {Pressable} from '@/ui/HapticPressable';
import {Sheet} from '@/components/Sheet/Sheet';
import {Divider} from '@/ui/components/Primitives';
import {designTokens} from '@/ui/designTokens';

export type SheetOption = {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

type OptionsSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: SheetOption[];
  value: string | null;
  onSelect: (value: string) => void;
};

/** Single-choice list sheet — priority, repeat, and similar pickers. */
export function OptionsSheet({visible, onClose, title, options, value, onSelect}: OptionsSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={{paddingHorizontal: 20, paddingBottom: 8}}>
        {options.map((option, index) => {
          const active = option.value === value;

          return (
            <View key={option.value}>
              <Pressable
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityState={{selected: active}}
                style={({pressed}) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingVertical: 16,
                  opacity: pressed ? 0.6 : 1,
                })}>
                {option.icon ? (
                  <Ionicons name={option.icon} size={20} color={designTokens.textSecondary} />
                ) : null}
                <Text style={{flex: 1, color: designTokens.textPrimary, fontSize: 16}}>
                  {option.label}
                </Text>
                {active ? (
                  <Ionicons name="checkmark" size={18} color={designTokens.textPrimary} />
                ) : null}
              </Pressable>
              {index < options.length - 1 ? <Divider /> : null}
            </View>
          );
        })}
      </View>
    </Sheet>
  );
}
