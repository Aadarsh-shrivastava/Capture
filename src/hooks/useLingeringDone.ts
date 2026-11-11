import {useCallback, useState} from 'react';

import type {FocusTask} from '@/models/focusTask';

/** Matches the 1s slide-out, plus a beat so the row is gone before the list reflows. */
const LINGER_MS = 1100;

/**
 * Keeps just-completed tasks on screen while they slide out, then drops them.
 * The snapshot is the task as it was (not marked completed, not the refreshed/rolled repeat), so it keeps
 * its slot — e.g. an overdue Now card stays Now while it slides, instead of vanishing and being replaced.
 */
export function useLingeringDone() {
  const [lingering, setLingering] = useState<FocusTask[]>([]);

  const linger = useCallback((task: FocusTask) => {
    setLingering(list => [...list.filter(t => t.id !== task.id), task]);
    setTimeout(() => {
      setLingering(list => list.filter(t => t.id !== task.id));
    }, LINGER_MS);
  }, []);

  const withLingering = useCallback(
    (tasks: FocusTask[]) => [...tasks.filter(t => !lingering.some(l => l.id === t.id)), ...lingering],
    [lingering],
  );

  return {linger, withLingering, isLingering: (id: number) => lingering.some(t => t.id === id)};
}
