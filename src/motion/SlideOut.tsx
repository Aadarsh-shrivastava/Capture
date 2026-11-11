import {useEffect, useRef, type ReactNode} from 'react';
import {Animated, Dimensions, type StyleProp, type ViewStyle} from 'react-native';

type Props = {
  children: ReactNode;
  /** Flip to true to slide the content off to the right and fade it. */
  out: boolean;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
};

/** Slides + fades its content away on the native thread when `out` turns true. */
export function SlideOut({children, out, delay = 0, duration = 1000, style}: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!out) {
      progress.setValue(0); // back in place if the row stays (e.g. a completed task in a list)
      return;
    }
    const anim = Animated.timing(progress, {toValue: 1, duration, delay, useNativeDriver: true});
    anim.start();
    return () => anim.stop();
  }, [out, delay, duration, progress]);

  return (
    <Animated.View
      pointerEvents={out ? 'none' : 'auto'}
      style={[
        style,
        {
          opacity: progress.interpolate({inputRange: [0, 1], outputRange: [1, 0]}),
          transform: [{translateX: progress.interpolate({inputRange: [0, 1], outputRange: [0, Dimensions.get('window').width]})}],
        },
      ]}>
      {children}
    </Animated.View>
  );
}
