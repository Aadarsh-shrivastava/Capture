import {Ionicons} from '@expo/vector-icons';
import {Image, Text, View} from 'react-native';

import {designTokens} from '@/ui/designTokens';

import {photoUri} from './photo';
import {avatarText, useProfileStore} from './store';

/** Profile photo, else emoji/initial, else a person icon. */
export function Avatar({size}: {size: number}) {
  const profile = useProfileStore();
  const uri = photoUri(profile.photo);
  const text = avatarText(profile);

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
        <Ionicons name="person-outline" size={size * 0.42} color={designTokens.textSecondary} />
      )}
    </View>
  );
}
