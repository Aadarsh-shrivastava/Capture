import {Image, View, type StyleProp, type ViewStyle} from 'react-native';

import {MASCOT_FRAMES, SHEET, type MascotPose} from './frames';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SHEET_IMAGE = require('../../assets/images/mascot.png');

/** One pose cropped out of the sprite sheet: a clipped window over the scaled sheet. */
export function Mascot({
  pose,
  width,
  style,
  halo = true,
}: {
  pose: MascotPose;
  width: number;
  style?: StyleProp<ViewStyle>;
  /** Soft light disc behind the figure for contrast on dark screens. */
  halo?: boolean;
}) {
  const frame = MASCOT_FRAMES[pose];
  const scale = width / frame.w;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{width, height: frame.h * scale, overflow: 'hidden'}, style]}>
      {halo ? (
        <View
          style={{
            position: 'absolute',
            alignSelf: 'center',
            top: frame.h * scale * 0.08,
            width: width * 0.86,
            height: width * 0.86,
            borderRadius: width,
            backgroundColor: 'rgba(255, 255, 255, 0.07)',
          }}
        />
      ) : null}
      <Image
        source={SHEET_IMAGE}
        style={{
          position: 'absolute',
          width: SHEET.width * scale,
          height: SHEET.height * scale,
          left: -frame.x * scale,
          top: -frame.y * scale,
        }}
      />
    </View>
  );
}
