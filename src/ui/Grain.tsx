import {useState} from 'react';
import {Image, PixelRatio, StyleSheet, View} from 'react-native';

const grain = require('../../assets/images/grain.png');
/** grain.png is 512px square; drawn at one image pixel per screen pixel. */
const TILE = 512 / PixelRatio.get();

/**
 * Faint noise laid over a gradient. Native gradients aren't dithered, so a dark one shows
 * ~1-level steps as bands; per-pixel noise breaks them up. Tiled by hand at 1:1 scale: stretched
 * noise turns into a visible matte texture, and Android ignores resizeMode="repeat".
 * `radius`: match the parent's corners.
 */
export function Grain({radius = 0}: {radius?: number}) {
  const [size, setSize] = useState({width: 0, height: 0});
  const cols = Math.ceil(size.width / TILE);
  const rows = Math.ceil(size.height / TILE);

  return (
    <View
      onLayout={e => setSize(e.nativeEvent.layout)}
      style={[StyleSheet.absoluteFill, {borderRadius: radius, overflow: 'hidden', pointerEvents: 'none'}]}>
      {Array.from({length: rows * cols}, (_, i) => (
        <Image
          key={i}
          source={grain}
          fadeDuration={0}
          style={{position: 'absolute', left: (i % cols) * TILE, top: Math.floor(i / cols) * TILE, width: TILE, height: TILE}}
        />
      ))}
    </View>
  );
}
