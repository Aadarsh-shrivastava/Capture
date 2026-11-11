import moment from 'moment';

import type {FocusTask} from '@/models/focusTask';
import {hasTimeComponent} from '@/ui/formatDateTime';

/** Not-done tasks whose due day is before today. */
export function leftoverTasks(tasks: FocusTask[], now: Date): FocusTask[] {
  return tasks.filter(task => {
    const due = task.dueAt?.trim();
    if (!due || ['completed', 'cancelled'].includes(task.doableStatus) || task.status === 'deferred') return false;
    return moment(due).isBefore(now, 'day');
  });
}

/** Same time (if any) on a different day. */
export function moveToDay(dueAt: string | null, day: Date): string {
  const target = moment(day);
  if (!dueAt || !hasTimeComponent(dueAt)) return target.format('YYYY-MM-DD');
  const due = moment(dueAt);
  return target.hour(due.hour()).minute(due.minute()).second(0).format();
}

export function dayKey(now: Date): string {
  return moment(now).format('YYYY-MM-DD');
}
