import {useEffect, useState} from 'react';

import {parseDays} from '@/behaviors/data';
import {behaviorDataRepository} from '@/repositories/behaviorDataRepository';
import {taskHistoryRepository} from '@/repositories/taskHistoryRepository';
import {useDataVersionStore} from '@/store/dataVersionStore';

import {dayProgress} from './utils';

/** Done/total for a day — the one source for the progress bar and the "all done" state. Refreshes on any save. */
export function useDayProgress(day: Date): {done: number; total: number} {
  const [progress, setProgress] = useState({done: 0, total: 0});
  const version = useDataVersionStore(state => state.version);
  const key = day.toDateString();

  useEffect(() => {
    Promise.all([taskHistoryRepository.findAll(), behaviorDataRepository.allForBehavior('Repeatable')])
      .then(([rows, repeats]) => {
        const repeatDone = new Map([...repeats].map(([id, data]) => [id, parseDays(data.done)]));
        setProgress(dayProgress(rows, new Date(key), repeatDone));
      })
      .catch(() => {});
  }, [key, version]);

  return progress;
}
