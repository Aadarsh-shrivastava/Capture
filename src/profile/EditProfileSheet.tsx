import {useEffect, useState} from 'react';
import {Alert, Text, TextInput, View} from 'react-native';

import {Sheet} from '@/components/Sheet/Sheet';
import {PrimaryButton} from '@/ui/components/Primitives';
import {designTokens, radius} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

import {CharacterPicker} from '@/mascot';

import {Avatar} from './Avatar';
import {pickProfilePhoto} from './photo';

import {useProfileStore} from './store';

const field = {
  backgroundColor: designTokens.field,
  borderRadius: radius.md,
  paddingHorizontal: 16,
  paddingVertical: 14,
  color: designTokens.textPrimary,
  fontSize: 16,
};

export function EditProfileSheet({visible, onClose}: {visible: boolean; onClose: () => void}) {
  const {name, avatar, photo, update} = useProfileStore();
  const [draftName, setDraftName] = useState(name);
  const [draftAvatar, setDraftAvatar] = useState(avatar);

  useEffect(() => {
    if (visible) {
      setDraftName(name);
      setDraftAvatar(avatar);
    }
  }, [visible, name, avatar]);

  return (
    <Sheet visible={visible} onClose={onClose} title="Edit profile">
      <View style={{paddingHorizontal: 20, paddingBottom: 16, gap: 12}}>
        <Pressable
          onPress={async () => {
            try {
              const picked = await pickProfilePhoto(photo);
              if (picked) update({name, avatar, photo: picked});
            } catch (err) {
              Alert.alert('Could not use that photo', err instanceof Error ? err.message : String(err));
            }
          }}
          style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
          <Avatar size={56} />
          <Text style={{color: designTokens.textPrimary, fontSize: 15}}>{photo ? 'Change photo' : 'Choose photo'}</Text>
          {photo ? (
            <Pressable onPress={() => update({name, avatar, photo: undefined})} hitSlop={8} style={{marginLeft: 'auto'}}>
              <Text style={{color: designTokens.textTertiary, fontSize: 14}}>Remove</Text>
            </Pressable>
          ) : null}
        </Pressable>
        <TextInput value={draftName} onChangeText={setDraftName} placeholder="Your name" placeholderTextColor={designTokens.textTertiary} style={field} />
        <TextInput
          value={draftAvatar}
          onChangeText={text => setDraftAvatar([...text].slice(-2).join(''))}
          placeholder="Avatar: an emoji or letter (optional)"
          placeholderTextColor={designTokens.textTertiary}
          style={field}
        />
        <Text style={{color: designTokens.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 4}}>Companion</Text>
        <CharacterPicker size={52} />
        <Text style={{color: designTokens.textTertiary, fontSize: 12}}>Stored only on this device.</Text>
        <PrimaryButton
          compact
          label="Save"
          onPress={() => {
            update({name: draftName, avatar: draftAvatar, photo});
            onClose();
          }}
        />
      </View>
    </Sheet>
  );
}
