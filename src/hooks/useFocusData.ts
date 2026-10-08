import {useCallback, useMemo, useState} from 'react';

import {partitionFocusTasks} from '@/domain/focusPriority';
import type {FocusQueue, FocusTask} from '@/models/focusTask';
import {focusRepository} from '@/repositories/focusRepository';
import {syncHomeWidgetFocusFromTasks} from '@/widget/syncHomeWidgetFocus';

const EMPTY_QUEUE: FocusQueue = {
  overdue: [],
  doNow: null,
  next: [],
  later: [],
};

export function useFocusData() {
  const [tasks, setTasks] = useState<FocusTask[]>([]);
  const [queue, setQueue] = useState<FocusQueue>(EMPTY_QUEUE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const loaded = await focusRepository.findActiveTasks();
      setTasks(loaded);
      setQueue(partitionFocusTasks(loaded));
      syncHomeWidgetFocusFromTasks(loaded);
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

  return {tasks, queue, loading, error, stats, refresh};
};
