import {Image, View} from 'react-native';

import {CHARACTERS, frameOf, type CharacterKey} from './characters';
import {useMascotStore} from './store';

const ZOOM = 1.7;

/** The character's face filling a circle of `size` (used as the default avatar and in the picker). */
export function MascotFace({size, character}: {size: number; character?: CharacterKey}) {
  const chosen = useMascotStore(state => state.character);
  const sheet = CHARACTERS[character ?? chosen];
  const frame = frameOf(sheet, 'neutral');
  const scale = (size * ZOOM) / frame.w;

  return (
    <View style={{width: size, height: size, borderRadius: size / 2, overflow: 'hidden'}}>
      <Image
        source={sheet.sheet}
        style={{
          position: 'absolute',
          width: sheet.width * scale,
          height: sheet.height * scale,
          left: size / 2 - (frame.x + frame.w * sheet.face.x) * scale,
          top: size / 2 - (frame.y + frame.h * sheet.face.y) * scale,
        }}
      />
    </View>
  );
}
