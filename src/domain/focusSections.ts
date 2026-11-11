import moment from 'moment';

import {isTaskOverdue, scoreFocusTask} from '@/domain/focusPriority';
import type {FocusTask} from '@/models/focusTask';
import {hasTimeComponent} from '@/ui/formatDateTime';

export const NEXT_LIMIT = 2;

export function dueMoment(task: FocusTask) {
  if (!task.dueAt?.trim()) return null;
  const parsed = moment(task.dueAt, moment.ISO_8601, false);
  return parsed.isValid() ? parsed : null;
}

/** Tasks shown for a day: everything due that day, plus undated and overdue work on today. `now` = the clock to judge "today"/"overdue" by. */
export function tasksForDay(tasks: FocusTask[], day: moment.Moment, now = moment()) {
  const isToday = day.isSame(now, 'day');

  return tasks.filter(task => {
    const due = dueMoment(task);
    if (!due) return isToday;
    if (due.isSame(day, 'day')) return true;
    return isToday && isTaskOverdue(task, now.valueOf());
  });
}

/** Ties (same score) go to the earlier time; untimed after timed. */
const timeOf = (task: FocusTask) => (task.dueAt && hasTimeComponent(task.dueAt) ? moment(task.dueAt).valueOf() : Infinity);

/** A timed task becomes "Now" only this close to its start; earlier it waits in Next with its time. */
export const NOW_WINDOW_MS = 60 * 60 * 1000;

/**
 * One score for the whole day (overdue, about-to-start, urgency, importance, due soon).
 * Now = the top task you can act on now (untimed, overdue, or starting within the hour) — a 6 PM task
 * is never "Now" at 10 AM; with nothing actionable, Now is empty (a free stretch).
 * Next = the following 2, Later = the rest.
 */
export function splitFocusDay(tasks: FocusTask[], now = Date.now()): {now: FocusTask | null; next: FocusTask[]; later: FocusTask[]} {
  const ranked = tasks
    .map(task => ({task, score: scoreFocusTask(task, now)}))
    .sort((a, b) => b.score - a.score || timeOf(a.task) - timeOf(b.task))
    .map(r => r.task);
  const actionable = ranked.filter(t => timeOf(t) === Infinity || timeOf(t) <= now + NOW_WINDOW_MS);
  let current = actionable[0] ?? null;
  // Two timed tasks both about to start: the one that starts first is Now, whatever their priority (11:00 before 11:30).
  if (current && timeOf(current) !== Infinity && timeOf(current) > now) {
    current = actionable.filter(t => timeOf(t) > now && timeOf(t) !== Infinity).sort((a, b) => timeOf(a) - timeOf(b))[0];
  }
  const rest = ranked.filter(t => t !== current);
  return {now: current, next: rest.slice(0, NEXT_LIMIT), later: rest.slice(NEXT_LIMIT)};
}
