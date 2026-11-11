import {Image, View, type StyleProp, type ViewStyle} from 'react-native';

import {designTokens} from '@/ui/designTokens';

import {CHARACTERS, frameOf, type CharacterKey, type MascotPose} from './characters';
import {useMascotStore} from './store';

type Props = {
  pose: MascotPose;
  width: number;
  style?: StyleProp<ViewStyle>;
  /** Soft light disc behind the figure for contrast on dark screens. */
  halo?: boolean;
  /** Override the user's chosen character (e.g. the picker shows both). */
  character?: CharacterKey;
};

/** Box height ÷ width, the same for every character so swapping one never changes layout. */
const BOX_RATIO = 1.1;

/** One pose cropped out of the current character's sprite sheet: a clipped window over the scaled sheet. */
export function Mascot({pose, width, style, halo = true, character}: Props) {
  const chosen = useMascotStore(state => state.character);
  const sheet = CHARACTERS[character ?? chosen];
  const frame = frameOf(sheet, pose);
  const scale = width / frame.w;
  const height = width * BOX_RATIO;
  // Centre the cell vertically in the fixed box (taller cells lose a sliver top and bottom).
  const offsetY = (height - frame.h * scale) / 2;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{width, height, overflow: 'hidden'}, style]}>
      {halo ? (
        <View
          style={{
            position: 'absolute',
            alignSelf: 'center',
            top: height * 0.08,
            width: width * 0.8,
            height: width * 0.8,
            borderRadius: width,
            backgroundColor: designTokens.chip,
          }}
        />
      ) : null}
      <Image
        // Android fades a new source in over 300ms: switching avatar flickered.
        fadeDuration={0}
        source={sheet.sheet}
        style={{
          position: 'absolute',
          width: sheet.width * scale,
          height: sheet.height * scale,
          left: -frame.x * scale,
          top: offsetY - frame.y * scale,
        }}
      />
    </View>
  );
}
