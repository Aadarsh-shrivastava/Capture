import {useCallback, useEffect, useState} from 'react';

import type {FocusTask} from '@/models/focusTask';
import {focusRepository} from '@/repositories/focusRepository';
import {useDataVersionStore} from '@/store/dataVersionStore';
import {syncHomeWidgetFocusFromTasks} from '@/widget/syncHomeWidgetFocus';

export function useFocusData() {
  const [tasks, setTasks] = useState<FocusTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const loaded = await focusRepository.findActiveTasks();
      setTasks(loaded);
      syncHomeWidgetFocusFromTasks(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load focus');
    } finally {
      setLoading(false);
    }
  }, []);

  const version = useDataVersionStore(state => state.version);
  useEffect(() => {
    if (version > 0) refresh();
  }, [version, refresh]);

  return {tasks, loading, error, refresh};
};
