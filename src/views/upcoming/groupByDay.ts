import moment from 'moment';

import type {FocusTask} from '@/models/focusTask';
import {hasTimeComponent} from '@/ui/formatDateTime';

export type DayGroup = {day: string; tasks: FocusTask[]};

/** Next `days` days (today first). Overdue and undated tasks fold into today, as on the Today screen; unsure ones wait in Quick check. */
export function groupByDay(tasks: FocusTask[], now: Date, days = 7): DayGroup[] {
  const start = moment(now).startOf('day');
  const groups: DayGroup[] = Array.from({length: days}, (_, i) => ({day: start.clone().add(i, 'days').format('YYYY-MM-DD'), tasks: []}));
  for (const task of tasks) {
    if (task.unsure) continue;
    const index = task.dueAt ? Math.max(0, moment(task.dueAt).startOf('day').diff(start, 'days')) : 0;
    groups[index]?.tasks.push(task);
  }
  const at = (t: FocusTask) => (t.dueAt && hasTimeComponent(t.dueAt) ? moment(t.dueAt).valueOf() : Infinity);
  for (const g of groups) g.tasks.sort((a, b) => at(a) - at(b));
  return groups;
}
