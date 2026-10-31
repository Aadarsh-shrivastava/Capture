import moment from 'moment';

import {scoreFocusTask} from '@/domain/focusPriority';
import type {FocusTask} from '@/models/focusTask';
import {hasTimeComponent} from '@/ui/formatDateTime';

export const NEXT_LIMIT = 2;

const isTimed = (task: FocusTask) => Boolean(task.dueAt && hasTimeComponent(task.dueAt));

/**
 * Now = earliest timed task (or the top untimed one if none are timed),
 * Next = the following 2 timed tasks, Later = everything else incl. all untimed tasks.
 */
export function splitFocusDay(tasks: FocusTask[]): {now: FocusTask | null; next: FocusTask[]; later: FocusTask[]} {
  const timed = tasks.filter(isTimed).sort((a, b) => moment(a.dueAt).valueOf() - moment(b.dueAt).valueOf());
  const untimed = tasks.filter(t => !isTimed(t)).sort((a, b) => scoreFocusTask(b) - scoreFocusTask(a));

  if (timed.length === 0) return {now: untimed[0] ?? null, next: [], later: untimed.slice(1)};
  return {
    now: timed[0],
    next: timed.slice(1, 1 + NEXT_LIMIT),
    later: [...timed.slice(1 + NEXT_LIMIT), ...untimed],
  };
}
