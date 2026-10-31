import {useEffect, useState} from 'react';
import {Text, TextInput, View} from 'react-native';

import {Sheet} from '@/components/Sheet/Sheet';
import {PrimaryButton} from '@/ui/components/Primitives';
import {designTokens, radius} from '@/ui/designTokens';

const fieldStyle = {
  backgroundColor: designTokens.field,
  borderRadius: radius.md,
  paddingHorizontal: 16,
  paddingVertical: 14,
  color: designTokens.textPrimary,
  fontSize: 16,
};

type Props = {
  visible: boolean;
  onClose: () => void;
  name: string;
  description: string;
  onSave: (name: string, description: string) => void;
  title?: string;
};

export function EditGroupSheet({visible, onClose, name, description, onSave, title = 'Edit group'}: Props) {
  const [draftName, setDraftName] = useState(name);
  const [draftDescription, setDraftDescription] = useState(description);

  useEffect(() => {
    if (visible) {
      setDraftName(name);
      setDraftDescription(description);
    }
  }, [visible, name, description]);

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={{paddingHorizontal: 20, paddingBottom: 16, gap: 12}}>
        <TextInput value={draftName} onChangeText={setDraftName} placeholder="Name" placeholderTextColor={designTokens.textTertiary} style={fieldStyle} />
        <TextInput
          value={draftDescription}
          onChangeText={setDraftDescription}
          placeholder="What belongs here? e.g. workouts, diet, protein"
          placeholderTextColor={designTokens.textTertiary}
          multiline
          style={{...fieldStyle, minHeight: 80, textAlignVertical: 'top'}}
        />
        <Text style={{color: designTokens.textTertiary, fontSize: 12}}>
          The description helps capture sort new items into this group automatically.
        </Text>
        <PrimaryButton
          compact
          label="Save"
          disabled={!draftName.trim()}
          onPress={() => {
            onSave(draftName, draftDescription);
            onClose();
          }}
        />
      </View>
    </Sheet>
  );
}
