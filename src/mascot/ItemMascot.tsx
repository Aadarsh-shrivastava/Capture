import {Image, View, type StyleProp, type ViewStyle} from 'react-native';

import {designTokens} from '@/ui/designTokens';

import {ITEM_MASCOT_KEYS, ITEM_SHEET, type ItemMascot as ItemMascotKey} from './itemMascots';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SHEET = require('../../assets/images/mascot-tasks.png');
/** Fraction trimmed off each side of a cell. */
const INSET = 0.1;
/** Rows on the sheet overlap a little; shift the frame down this fraction of a cell to clear the row above. */
const DROP = 0.06;

/** One item sticker (square), cropped out of the tasks sheet like Mascot does with a character sheet. */
export function ItemMascot({mascot, size, style}: {mascot: ItemMascotKey; size: number; style?: StyleProp<ViewStyle>}) {
  const index = ITEM_MASCOT_KEYS.indexOf(mascot);
  const w = ITEM_SHEET.width / ITEM_SHEET.cols;
  const h = ITEM_SHEET.height / ITEM_SHEET.rows;
  // Zoom slightly into the cell so bits of neighbouring stickers stay outside the frame.
  const scale = size / (Math.max(w, h) * (1 - INSET * 2));
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{width: size, height: size, overflow: 'hidden', borderRadius: size / 4, backgroundColor: designTokens.chip}, style]}>
      <Image
        // Android fades a new source in over 300ms: switching avatar flickered.
        fadeDuration={0}
        source={SHEET}
        style={{
          position: 'absolute',
          width: ITEM_SHEET.width * scale,
          height: ITEM_SHEET.height * scale,
          left: -(index % ITEM_SHEET.cols) * w * scale + (size - w * scale) / 2,
          top: -(Math.floor(index / ITEM_SHEET.cols) + DROP) * h * scale + (size - h * scale) / 2,
        }}
      />
    </View>
  );
}
