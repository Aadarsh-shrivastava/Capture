import moment from 'moment';

import type {TaskHistoryRow} from '@/repositories/taskHistoryRepository';

/**
 * Tasks due on `day`: how many are done out of the total. A completed repeat has already rolled
 * to its next date, so its done days (`repeatDone`, item id → YYYY-MM-DD[]) put it back on `day` as done.
 */
export function dayProgress(rows: TaskHistoryRow[], day: Date, repeatDone = new Map<number, string[]>()): {done: number; total: number} {
  const key = moment(day).format('YYYY-MM-DD');
  let done = 0;
  let total = 0;
  for (const r of rows) {
    if (r.status === 'cancelled') continue;
    const repeatedToday = repeatDone.get(r.id)?.includes(key) ?? false;
    const dueToday = Boolean(r.dueAt && moment(r.dueAt).isSame(day, 'day'));
    if (!repeatedToday && !dueToday) continue;
    total++;
    if (repeatedToday || r.status === 'completed') done++;
  }
  return {done, total};
}
