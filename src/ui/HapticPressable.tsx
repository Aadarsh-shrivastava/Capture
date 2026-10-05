import * as Haptics from 'expo-haptics';
import {forwardRef, useCallback} from 'react';
import {
  Pressable as RNPressable,
  type GestureResponderEvent,
  type PressableProps,
} from 'react-native';

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection';

type HapticPressableProps = PressableProps & {
  /** Defaults to light impact. Pass `false` to disable haptics for this control. */
  haptic?: HapticStyle | false;
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
    ...rest
  },
  ref,
) {
  const isInteractive = Boolean(onPress ?? onLongPress);

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      if (haptic !== false && !disabled && isInteractive) {
        runHaptic(haptic);
      }
      onPressIn?.(event);
    },
    [disabled, haptic, isInteractive, onPressIn],
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
    <RNPressable
      ref={ref}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress ? handleLongPress : undefined}
      onPressIn={handlePressIn}
      {...rest}
    />
  );
});
