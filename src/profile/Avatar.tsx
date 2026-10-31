import {Image, Text, View} from 'react-native';

import {Mascot} from '@/mascot';
import {designTokens} from '@/ui/designTokens';

import {photoUri} from './photo';
import {avatarText, useProfileStore} from './store';

/** Profile photo, else chosen emoji/letter, else the mascot's face. */
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
        // Bust pose scaled up so the face (≈74% across, 42% down the frame) sits in the circle's centre.
        <Mascot
          pose="neutral"
          width={size * 1.7}
          halo={false}
          style={{position: 'absolute', left: size / 2 - size * 1.7 * 0.74, top: size / 2 - size * 1.7 * (372 / 384) * 0.42}}
        />
      )}
    </View>
  );
}
