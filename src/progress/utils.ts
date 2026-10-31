import moment from 'moment';

import type {TaskHistoryRow} from '@/repositories/taskHistoryRepository';

/** Tasks due on `day`: how many are done out of the total. */
export function dayProgress(rows: TaskHistoryRow[], day: Date): {done: number; total: number} {
  const due = rows.filter(r => r.dueAt && moment(r.dueAt).isSame(day, 'day') && r.status !== 'cancelled');
  return {done: due.filter(r => r.status === 'completed').length, total: due.length};
}
