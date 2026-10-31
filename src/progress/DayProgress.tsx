import {useEffect, useRef, useState} from 'react';
import {Animated, Text, View} from 'react-native';

import {taskHistoryRepository} from '@/repositories/taskHistoryRepository';
import {useDataVersionStore} from '@/store/dataVersionStore';
import {designTokens} from '@/ui/designTokens';

import {dayProgress} from './utils';

/** Slim "3 of 5 done" bar for a day; hidden when nothing is due. */
export function DayProgress({day}: {day: Date}) {
  const [progress, setProgress] = useState({done: 0, total: 0});
  const version = useDataVersionStore(state => state.version);
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    taskHistoryRepository
      .findAll()
      .then(rows => setProgress(dayProgress(rows, day)))
      .catch(() => {});
  }, [day, version]);

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
