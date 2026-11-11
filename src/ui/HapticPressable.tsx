import * as Haptics from 'expo-haptics';
import {forwardRef, useCallback, useState} from 'react';
import {
  Animated,
  Pressable as RNPressable,
  StyleSheet,
  type GestureResponderEvent,
  type PressableProps,
} from 'react-native';

import {usePressScale} from '@/motion/usePressScale';

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection';

type HapticPressableProps = PressableProps & {
  /** Defaults to light impact. Pass `false` to disable haptics for this control. */
  haptic?: HapticStyle | false;
  /** Shrinks to this while pressed (default 0.97). `false` for big surfaces, e.g. a full-screen backdrop. */
  pressScale?: number | false;
};

function runHaptic(style: HapticStyle) {
  switch (style) {
    case 'light':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'medium':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'heavy':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'selection':
      void Haptics.selectionAsync();
      break;
  }
}

export const Pressable = forwardRef<
  React.ElementRef<typeof RNPressable>,
  HapticPressableProps
>(function HapticPressable(
  {
    haptic = 'light',
    disabled,
    onPress,
    onLongPress,
    onPressIn,
    onPressOut,
    pressScale = 0.97,
    style,
    ...rest
  },
  ref,
) {
  const press = usePressScale(pressScale || 1);
  const animated = pressScale !== false && !disabled && Boolean(onPress ?? onLongPress);
  // Animated components can't take a style function: resolve it here with our own pressed state.
  const [pressed, setPressed] = useState(false);
  const resolved = StyleSheet.flatten(typeof style === 'function' ? style({pressed}) : style) ?? {};
  // Our scale goes after any transform the caller set.
  const finalStyle = animated ? [resolved, {transform: [...(Array.isArray(resolved.transform) ? resolved.transform : []), {scale: press.scale}]}] : resolved;

  // On lift, not touch-down: a touch that turns into a scroll is cancelled before onPress, so scrolling never buzzes.
  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (haptic !== false && !disabled) {
        runHaptic(haptic);
      }
      onPress?.(event);
    },
    [disabled, haptic, onPress],
  );

  const handleLongPress = useCallback(
    (event: GestureResponderEvent) => {
      if (haptic !== false && !disabled && onLongPress) {
        runHaptic('medium');
      }
      onLongPress?.(event);
    },
    [disabled, haptic, onLongPress],
  );

  return (
    <AnimatedPressable
      ref={ref}
      disabled={disabled}
      onPress={onPress ? handlePress : undefined}
      onLongPress={onLongPress ? handleLongPress : undefined}
      onPressIn={e => {
        if (animated) press.pressIn();
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={e => {
        if (animated) press.pressOut();
        setPressed(false);
        onPressOut?.(e);
      }}
      style={finalStyle as PressableProps['style']}
      {...rest}
    />
  );
});
