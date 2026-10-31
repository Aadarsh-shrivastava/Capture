import {useEffect, useRef, useState} from 'react';
import {Animated, type StyleProp, type TextStyle} from 'react-native';

const OUT_MS = 180;
const IN_MS = 260;

/** One line that drifts up and fades out, then the next drifts in — like thoughts passing. */
export function ThoughtTicker({text, style}: {text: string; style?: StyleProp<TextStyle>}) {
  const [shown, setShown] = useState(text);
  const opacity = useRef(new Animated.Value(1)).current;
  const shift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (text === shown) return;
    const out = Animated.parallel([
      Animated.timing(opacity, {toValue: 0, duration: OUT_MS, useNativeDriver: true}),
      Animated.timing(shift, {toValue: -8, duration: OUT_MS, useNativeDriver: true}),
    ]);
    out.start(({finished}) => {
      if (!finished) return;
      setShown(text);
      shift.setValue(8);
      Animated.parallel([
        Animated.timing(opacity, {toValue: 1, duration: IN_MS, useNativeDriver: true}),
        Animated.timing(shift, {toValue: 0, duration: IN_MS, useNativeDriver: true}),
      ]).start();
    });
    return () => out.stop();
  }, [text, shown, opacity, shift]);

  return (
    <Animated.Text numberOfLines={2} style={[style, {opacity, transform: [{translateY: shift}]}]}>
      {shown}
    </Animated.Text>
  );
}
