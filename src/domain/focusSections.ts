import moment from 'moment';

import {scoreFocusTask} from '@/domain/focusPriority';
import type {FocusTask} from '@/models/focusTask';
import {hasTimeComponent} from '@/ui/formatDateTime';

export const NEXT_LIMIT = 2;

/** Ties (same score) go to the earlier time; untimed after timed. */
const timeOf = (task: FocusTask) => (task.dueAt && hasTimeComponent(task.dueAt) ? moment(task.dueAt).valueOf() : Infinity);

/**
 * One score for the whole day (overdue, about-to-start, urgency, importance, due soon):
 * Now = top, Next = the following 2, Later = the rest. An urgent untimed task can beat a relaxed timed one.
 */
export function splitFocusDay(tasks: FocusTask[], now = Date.now()): {now: FocusTask | null; next: FocusTask[]; later: FocusTask[]} {
  const ranked = tasks
    .map(task => ({task, score: scoreFocusTask(task, now)}))
    .sort((a, b) => b.score - a.score || timeOf(a.task) - timeOf(b.task))
    .map(r => r.task);
  return {now: ranked[0] ?? null, next: ranked.slice(1, 1 + NEXT_LIMIT), later: ranked.slice(1 + NEXT_LIMIT)};
}
