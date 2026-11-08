import {useEffect, useState} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Appear, SwipeDismiss} from '@/motion';
import {designTokens, radius} from '@/ui/designTokens';

import {useCaptureQueue} from './queue';

/** Same spot as the undo toast, above the bottom tab bar. */
const BOTTOM_OFFSET = 96;

/** "Processing 3 items…" while the queue drains. Swipe away to hide it until the queue is empty. */
export function QueueStrip() {
  const pending = useCaptureQueue(s => s.pending);
  const insets = useSafeAreaInsets();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (pending === 0) setDismissed(false);
  }, [pending]);

  if (pending === 0 || dismissed) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{position: 'absolute', left: 16, right: 16, bottom: insets.bottom + BOTTOM_OFFSET}}>
      <SwipeDismiss onDismiss={() => setDismissed(true)}>
        <Appear
          from="up"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: radius.md,
            backgroundColor: designTokens.surfaceRaised,
            borderWidth: 1,
            borderColor: designTokens.surfaceBorder,
          }}>
          <ActivityIndicator size="small" color={designTokens.textSecondary} />
          <Text style={{color: designTokens.textPrimary, fontSize: 15}}>
            Processing {pending} {pending === 1 ? 'item' : 'items'}…
          </Text>
        </Appear>
      </SwipeDismiss>
    </View>
  );
}
