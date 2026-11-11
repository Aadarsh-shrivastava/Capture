import {Ionicons} from '@expo/vector-icons';
import {useRef, type ReactNode} from 'react';
import {Text, View} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';

import {designTokens, radius} from '@/ui/designTokens';

type SwipeAction = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onTrigger: () => void;
  /** Don't snap back — the row is about to leave (e.g. completed), so it shouldn't bounce in first. */
  stayOpen?: boolean;
};

type Props = {
  children: ReactNode;
  /** Revealed by swiping right. */
  left?: SwipeAction;
  /** Revealed by swiping left. */
  right?: SwipeAction;
};

function ActionPanel({action, align}: {action: SwipeAction; align: 'flex-start' | 'flex-end'}) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: align,
        paddingHorizontal: 20,
        borderRadius: radius.md,
        backgroundColor: designTokens.surfaceRaised,
      }}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
        <Ionicons name={action.icon} size={18} color={designTokens.textPrimary} />
        <Text style={{color: designTokens.textPrimary, fontSize: 14, fontWeight: '600'}}>{action.label}</Text>
      </View>
    </View>
  );
}

/** Row that fires an action on a full swipe, then snaps back (unless the action `stayOpen`s). */
export function SwipeRow({children, left, right}: Props) {
  const ref = useRef<Swipeable>(null);

  return (
    <Swipeable
      ref={ref}
      friction={1.5}
      leftThreshold={80}
      rightThreshold={80}
      renderLeftActions={left ? () => <ActionPanel action={left} align="flex-start" /> : undefined}
      renderRightActions={right ? () => <ActionPanel action={right} align="flex-end" /> : undefined}
      onSwipeableOpen={direction => {
        const action = direction === 'left' ? left : right;
        if (!action?.stayOpen) ref.current?.close();
        action?.onTrigger();
      }}>
      {children}
    </Swipeable>
  );
}
