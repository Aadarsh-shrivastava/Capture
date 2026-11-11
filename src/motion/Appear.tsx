import {useEffect, useRef, type ReactNode} from 'react';
import {Animated, type StyleProp, type ViewStyle} from 'react-native';

type Props = {
  children: ReactNode;
  /** 'fade' just fades; 'up'/'down' also slide in from that side. */
  from?: 'fade' | 'up' | 'down';
  style?: StyleProp<ViewStyle>;
  duration?: number;
};

const OFFSET = 16;

/** Fades (and optionally slides) its children in on mount. */
export function Appear({children, from = 'fade', style, duration = 220}: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {toValue: 1, duration, useNativeDriver: true}).start();
  }, [progress, duration]);

  const offset = from === 'up' ? OFFSET : from === 'down' ? -OFFSET : 0;
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{translateY: progress.interpolate({inputRange: [0, 1], outputRange: [offset, 0]})}],
        },
      ]}>
      {children}
    </Animated.View>
  );
}
