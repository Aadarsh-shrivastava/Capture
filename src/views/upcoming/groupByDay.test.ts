import type {FocusTask} from '@/models/focusTask';

import {groupByDay} from './groupByDay';

const now = new Date(2026, 9, 31, 10);
const t = (id: number, dueAt: string | null) => ({id, dueAt, title: `t${id}`}) as FocusTask;

test('7 days from today, overdue folded into today, timed first', () => {
  const groups = groupByDay(
    [t(1, '2026-10-29'), t(2, new Date(2026, 10, 1, 9).toISOString()), t(3, '2026-11-01'), t(4, '2026-11-20'), t(5, null)],
    now,
  );
  expect(groups).toHaveLength(7);
  expect(groups[0].tasks.map(x => x.id)).toEqual([1]);
  expect(groups[1].tasks.map(x => x.id)).toEqual([2, 3]);
  expect(groups.flatMap(g => g.tasks).map(x => x.id)).not.toContain(4);
});
