import {useRef, type ReactNode} from 'react';
import {Animated, PanResponder, useWindowDimensions} from 'react-native';

/** Past this (px), or flicked faster than FLICK, a release dismisses instead of snapping back. */
const DISTANCE = 80;
const FLICK = 0.5;

/** Swipe sideways to dismiss (toasts, strips). Taps inside still work — only a horizontal drag is taken. */
export function SwipeDismiss({children, onDismiss}: {children: ReactNode; onDismiss: () => void}) {
  const x = useRef(new Animated.Value(0)).current;
  const {width} = useWindowDimensions();
  const latest = useRef({onDismiss, width});
  latest.current = {onDismiss, width};

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => x.setValue(g.dx),
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) > DISTANCE || Math.abs(g.vx) > FLICK) {
          const side = Math.sign(g.dx || g.vx);
          Animated.timing(x, {toValue: side * latest.current.width, duration: 160, useNativeDriver: true}).start(() =>
            latest.current.onDismiss(),
          );
        } else {
          Animated.spring(x, {toValue: 0, useNativeDriver: true}).start();
        }
      },
      onPanResponderTerminate: () => Animated.spring(x, {toValue: 0, useNativeDriver: true}).start(),
    }),
  ).current;

  const opacity = x.interpolate({inputRange: [-width / 2, 0, width / 2], outputRange: [0, 1, 0], extrapolate: 'clamp'});
  return (
    <Animated.View {...pan.panHandlers} style={{opacity, transform: [{translateX: x}]}}>
      {children}
    </Animated.View>
  );
}
