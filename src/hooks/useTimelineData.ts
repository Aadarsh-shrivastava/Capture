import {useCallback, useState} from 'react';

import {buildTimelineActivity} from '@/domain/focusActivity';
import {itemApi} from '@/api/itemApi';
import type {FocusActivityEvent} from '@/models/focusTask';

export function useTimelineData() {
  const [events, setEvents] = useState<FocusActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const items = await itemApi.getItems();
      setEvents(buildTimelineActivity(items));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load timeline');
    } finally {
      setLoading(false);
    }
  }, []);

  return {events, loading, error, refresh};
};
