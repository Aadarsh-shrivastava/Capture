import {Image, Text, View} from 'react-native';

import {MascotFace} from '@/mascot';
import {designTokens} from '@/ui/designTokens';

import {photoUri} from './photo';
import {avatarText, useProfileStore} from './store';

/** Profile photo, else chosen emoji/letter, else the chosen mascot character's face. */
export function Avatar({size}: {size: number}) {
  const profile = useProfileStore();
  const uri = photoUri(profile.photo);
  // Initials only when the user picked an avatar text; otherwise the mascot stands in.
  const text = profile.avatar.trim() ? avatarText(profile) : '';

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: designTokens.surfaceRaised,
        borderWidth: 1,
        borderColor: designTokens.surfaceBorder,
      }}>
      {uri ? (
        <Image source={{uri}} style={{width: size, height: size}} />
      ) : text ? (
        <Text style={{color: designTokens.textPrimary, fontSize: size * 0.42, fontWeight: '600'}}>{text}</Text>
      ) : (
        <MascotFace size={size} />
      )}
    </View>
  );
}
