import {useCallback, useMemo, useState} from 'react';

import {partitionFocusTasks} from '@/domain/focusPriority';
import type {FocusQueue} from '@/models/focusTask';
import {focusRepository} from '@/repositories/focusRepository';

const EMPTY_QUEUE: FocusQueue = {
  overdue: [],
  doNow: null,
  next: [],
  later: [],
};

export function useFocusData() {
  const [queue, setQueue] = useState<FocusQueue>(EMPTY_QUEUE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const tasks = await focusRepository.findActiveTasks();
      setQueue(partitionFocusTasks(tasks));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load focus');
    } finally {
      setLoading(false);
    }
  }, []);

  const stats = useMemo(
    () => ({
      overdueCount: queue.overdue.length,
      nextCount: queue.next.length,
      laterCount: queue.later.length,
    }),
    [queue],
  );

  return {queue, loading, error, stats, refresh};
};
