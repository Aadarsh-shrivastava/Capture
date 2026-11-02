import {useEffect, useRef} from 'react';
import {Animated, Text, View} from 'react-native';

import {designTokens} from '@/ui/designTokens';

import {useDayProgress} from './useDayProgress';

/** Slim "3 of 5 done" bar for a day; hidden when nothing is due. */
export function DayProgress({day}: {day: Date}) {
  const progress = useDayProgress(day);
  const fill = useRef(new Animated.Value(0)).current;

  const pct = progress.total ? progress.done / progress.total : 0;
  useEffect(() => {
    // Springy fill on the native thread (scaleX, not width, so it never touches layout).
    Animated.spring(fill, {toValue: pct, useNativeDriver: true, friction: 6, tension: 60}).start();
  }, [pct, fill]);

  if (progress.total === 0) return null;

  return (
    <View style={{marginTop: 16, gap: 6}}>
      <View style={{height: 3, borderRadius: 2, backgroundColor: designTokens.chip, overflow: 'hidden'}}>
        <Animated.View
          style={{
            height: 3,
            backgroundColor: designTokens.textSecondary,
            transformOrigin: 'left',
            transform: [{scaleX: fill}],
          }}
        />
      </View>
      <Text style={{color: designTokens.textTertiary, fontSize: 12}}>
        {progress.done} of {progress.total} done
      </Text>
    </View>
  );
}
