import moment from 'moment';

import type {TaskHistoryRow} from '@/repositories/taskHistoryRepository';
import {hasTimeComponent} from '@/ui/formatDateTime';

export type WeekSummary = {done: TaskHistoryRow[]; slipped: TaskHistoryRow[]; upcoming: TaskHistoryRow[]};

const open = (r: TaskHistoryRow) => r.status !== 'completed' && r.status !== 'cancelled';

function isPast(dueAt: string, now: Date): boolean {
  return hasTimeComponent(dueAt) ? moment(dueAt).isBefore(now) : moment(dueAt).isBefore(now, 'day');
}

/** This ISO week's completions, everything overdue, and what's due next week. */
export function weekSummary(rows: TaskHistoryRow[], now: Date): WeekSummary {
  const nextWeek = moment(now).add(1, 'week');
  return {
    done: rows.filter(r => r.status === 'completed' && r.completedAt && moment(r.completedAt).isSame(now, 'isoWeek')),
    slipped: rows.filter(r => open(r) && r.dueAt && isPast(r.dueAt, now)),
    upcoming: rows.filter(r => open(r) && r.dueAt && moment(r.dueAt).isSame(nextWeek, 'isoWeek')),
  };
}

/** Sunday from 5 PM. */
export function isReviewTime(now: Date): boolean {
  return now.getDay() === 0 && now.getHours() >= 17;
}

export function weekKey(now: Date): string {
  return moment(now).format('GGGG-[W]WW');
}

/** This Sunday 7 PM, or next week's if that has passed. */
export function nextReviewAt(now: Date): Date {
  const at = moment(now).isoWeekday(7).hour(19).minute(0).second(0).millisecond(0);
  return (at.isAfter(now) ? at : at.add(1, 'week')).toDate();
}
