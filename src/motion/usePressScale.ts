import {useRef} from 'react';
import {Animated} from 'react-native';

/** Subtle shrink while pressed, back on release. Native driver: runs on the UI thread. */
export function usePressScale(to = 0.97) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (value: number) => Animated.spring(scale, {toValue: value, speed: 40, bounciness: value === 1 ? 6 : 0, useNativeDriver: true}).start();
  return {scale, pressIn: () => animate(to), pressOut: () => animate(1)};
}
