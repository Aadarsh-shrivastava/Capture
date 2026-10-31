import moment from 'moment';

import type {FocusTask} from '@/models/focusTask';
import {hasTimeComponent} from '@/ui/formatDateTime';

/** Remind this many minutes before a task's due time. */
export const LEAD_MINUTES = [30, 5];

export type Reminder = {task: FocusTask; at: Date; minutesBefore: number};

export function isDueToday(task: FocusTask, now: Date): boolean {
  const due = task.dueAt?.trim();
  return !!due && moment(due).isSame(now, 'day');
}

export function isNotDone(task: FocusTask): boolean {
  return !['completed', 'cancelled'].includes(task.doableStatus) && task.status !== 'deferred';
}

/** Future reminders for one task; none for date-only tasks. `leads` overrides the defaults (Remindable). */
export function reminderTimes(task: FocusTask, now: Date, leads: number[] = LEAD_MINUTES): Reminder[] {
  const due = task.dueAt?.trim();
  if (!due || !hasTimeComponent(due)) return [];
  return leads.map(minutesBefore => ({
    task,
    minutesBefore,
    at: moment(due).subtract(minutesBefore, 'minutes').toDate(),
  })).filter(r => r.at > now);
}

/** Not-done tasks already past due (timed: past the time; date-only: before today). */
export function overdueCount(tasks: FocusTask[], now: Date): number {
  return tasks.filter(task => {
    const due = task.dueAt?.trim();
    if (!due || !isNotDone(task)) return false;
    return hasTimeComponent(due) ? moment(due).isBefore(now) : moment(due).isBefore(now, 'day');
  }).length;
}

/** Morning summary hour (local). */
export const SUMMARY_HOUR = 8;

export type Summary = {day: Date; at: Date; tasks: FocusTask[]};

/** Not-done tasks due on `day`, timed ones first by time. */
export function tasksDueOn(tasks: FocusTask[], day: Date): FocusTask[] {
  return tasks
    .filter(task => isDueToday(task, day) && isNotDone(task))
    .sort((a, b) => {
      const at = hasTimeComponent(a.dueAt ?? '') ? moment(a.dueAt).valueOf() : Infinity;
      const bt = hasTimeComponent(b.dueAt ?? '') ? moment(b.dueAt).valueOf() : Infinity;
      return at - bt;
    });
}

/** 8 AM summaries for today (if 8 AM is still ahead) and tomorrow; skips empty days. */
export function summariesFor(tasks: FocusTask[], now: Date): Summary[] {
  return [0, 1]
    .map(offset => {
      const day = moment(now).add(offset, 'day').startOf('day');
      return {day: day.toDate(), at: day.clone().hour(SUMMARY_HOUR).toDate(), tasks: tasksDueOn(tasks, day.toDate())};
    })
    .filter(s => s.at > now && s.tasks.length > 0);
}

/** Cheapest check first: due today → not done → has a future reminder time. */
export function remindersFor(tasks: FocusTask[], now: Date, leadsFor: (taskId: number) => number[] | undefined = () => undefined): Reminder[] {
  return tasks
    .filter(task => isDueToday(task, now))
    .filter(isNotDone)
    .flatMap(task => reminderTimes(task, now, leadsFor(task.id)));
}
