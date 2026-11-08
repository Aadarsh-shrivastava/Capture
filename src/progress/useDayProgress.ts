import {useEffect, useMemo, useState} from 'react';

import {parseDays} from '@/behaviors/data';
import {behaviorDataRepository} from '@/repositories/behaviorDataRepository';
import {taskHistoryRepository, type TaskHistoryRow} from '@/repositories/taskHistoryRepository';
import {useDataVersionStore} from '@/store/dataVersionStore';

import {dayProgress} from './utils';

type Loaded = {rows: TaskHistoryRow[]; repeatDone: Map<number, string[]>};

/** Done/total for a day — the one source for the progress bar and the "all done" state. Refreshes on any save. */
export function useDayProgress(day: Date): {done: number; total: number} {
  // Load on save only; the per-day count is computed in render, so switching days never waits on the DB.
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const version = useDataVersionStore(state => state.version);
  const key = day.toDateString();

  useEffect(() => {
    Promise.all([taskHistoryRepository.findAll(), behaviorDataRepository.allForBehavior('Repeatable')])
      .then(([rows, repeats]) => {
        setLoaded({rows, repeatDone: new Map([...repeats].map(([id, data]) => [id, parseDays(data.done)]))});
      })
      .catch(() => {});
  }, [version]);

  return useMemo(
    () => (loaded ? dayProgress(loaded.rows, new Date(key), loaded.repeatDone) : {done: 0, total: 0}),
    [loaded, key],
  );
}
