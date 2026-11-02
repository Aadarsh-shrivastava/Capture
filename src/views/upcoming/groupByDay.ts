import moment from 'moment';

import type {FocusTask} from '@/models/focusTask';
import {hasTimeComponent} from '@/ui/formatDateTime';

export type DayGroup = {day: string; tasks: FocusTask[]};

/** Next `days` days (today first). Overdue tasks fold into today; undated tasks are left out. */
export function groupByDay(tasks: FocusTask[], now: Date, days = 7): DayGroup[] {
  const start = moment(now).startOf('day');
  const groups: DayGroup[] = Array.from({length: days}, (_, i) => ({day: start.clone().add(i, 'days').format('YYYY-MM-DD'), tasks: []}));
  for (const task of tasks) {
    if (!task.dueAt) continue;
    const due = moment(task.dueAt);
    const index = Math.max(0, due.clone().startOf('day').diff(start, 'days'));
    groups[index]?.tasks.push(task);
  }
  const at = (t: FocusTask) => (t.dueAt && hasTimeComponent(t.dueAt) ? moment(t.dueAt).valueOf() : Infinity);
  for (const g of groups) g.tasks.sort((a, b) => at(a) - at(b));
  return groups;
}
