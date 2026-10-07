import {useEffect, useState} from 'react';
import {TextInput, View} from 'react-native';

import {Sheet} from '@/components/Sheet/Sheet';
import {PrimaryButton} from '@/ui/components/Primitives';
import {designTokens, radius} from '@/ui/designTokens';

type NoteSheetProps = {
  visible: boolean;
  onClose: () => void;
  initialValue: string;
  onSubmit: (value: string) => void;
};

/** Multiline note editor used by the item detail "Notes" row. */
export function NoteSheet({visible, onClose, initialValue, onSubmit}: NoteSheetProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  return (
    <Sheet visible={visible} onClose={onClose} title="Notes">
      <View style={{paddingHorizontal: 20, paddingBottom: 8, gap: 16}}>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="Add a note..."
          placeholderTextColor={designTokens.textTertiary}
          multiline
          autoFocus
          style={{
            minHeight: 140,
            backgroundColor: designTokens.field,
            borderRadius: radius.md,
            padding: 16,
            color: designTokens.textPrimary,
            fontSize: 16,
            lineHeight: 24,
            textAlignVertical: 'top',
          }}
        />

        <PrimaryButton
          label="Save"
          onPress={() => {
            onSubmit(value.trim());
            onClose();
          }}
        />
      </View>
    </Sheet>
  );
}
