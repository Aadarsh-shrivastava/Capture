import {Text, View} from 'react-native';

import {designTokens} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

import {CHARACTERS, type CharacterKey} from './characters';
import {MascotFace} from './MascotFace';
import {useMascotStore} from './store';

/** Row of character faces; tapping one makes it the app's mascot. */
export function CharacterPicker({size = 64}: {size?: number}) {
  const {character, setCharacter} = useMascotStore();

  return (
    <View style={{flexDirection: 'row', justifyContent: 'center', gap: 20}}>
      {(Object.keys(CHARACTERS) as CharacterKey[]).map(key => {
        const active = key === character;
        return (
          <Pressable key={key} onPress={() => setCharacter(key)} accessibilityRole="radio" accessibilityState={{selected: active}} style={{alignItems: 'center', gap: 6, width: size + 24}}>
            <View style={{padding: 3, borderRadius: size, borderWidth: 2, borderColor: active ? designTokens.textPrimary : 'transparent'}}>
              <MascotFace size={size} character={key} />
            </View>
            <Text style={{color: active ? designTokens.textPrimary : designTokens.textTertiary, fontSize: 13}}>{CHARACTERS[key].label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
