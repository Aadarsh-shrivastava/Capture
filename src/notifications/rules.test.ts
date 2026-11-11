import type {FocusTask} from '@/models/focusTask';

import {remindersFor, summariesFor} from './rules';

const now = new Date(2026, 9, 31, 10, 0); // Sat 31 Oct 2026, 10:00 local

function task(id: number, dueAt: string | null, doableStatus = 'pending'): FocusTask {
  return {id, dueAt, doableStatus, status: 'active', title: `t${id}`} as FocusTask;
}

test('only today, not done, timed tasks with future reminders at 30 and 5 min', () => {
  const at = (h: number, m = 0) => new Date(2026, 9, 31, h, m).toISOString();
  const reminders = remindersFor(
    [
      task(1, at(18)), // today 18:00 → remind 17:30
      task(2, at(18), 'completed'), // done
      task(3, '2026-10-31'), // no time
      task(4, new Date(2026, 10, 1, 18).toISOString()), // tomorrow
      task(5, at(10, 20)), // 09:50 passed, 10:15 still ahead
      task(6, null),
    ],
    now,
  );
  expect(reminders.map(r => [r.task.id, r.minutesBefore])).toEqual([[1, 30], [1, 5], [5, 5]]);
  expect(reminders[0].at.getTime()).toBe(new Date(2026, 9, 31, 17, 30).getTime());
  expect(reminders[1].at.getTime()).toBe(new Date(2026, 9, 31, 17, 55).getTime());
});

test('8 AM summary for tomorrow, timed tasks first; skips empty and past days', () => {
  const tomorrow = (h: number) => new Date(2026, 10, 1, h).toISOString();
  const summaries = summariesFor([task(1, '2026-11-01'), task(2, tomorrow(18)), task(3, tomorrow(9), 'completed')], now);
  expect(summaries).toHaveLength(1); // today's 8 AM already passed at 10:00
  expect(summaries[0].at.getTime()).toBe(new Date(2026, 10, 1, 8).getTime());
  expect(summaries[0].tasks.map(t => t.id)).toEqual([2, 1]);
});

test('custom reminder offsets per task (Remindable)', () => {
  const t = task(9, new Date(2026, 9, 31, 18).toISOString());
  const reminders = remindersFor([t], now, id => (id === 9 ? [60, 0] : undefined));
  expect(reminders.map(r => r.minutesBefore)).toEqual([60, 0]);
});
