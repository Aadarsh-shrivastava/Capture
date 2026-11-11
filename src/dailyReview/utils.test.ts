import type {FocusTask} from '@/models/focusTask';

import {leftoverTasks, moveToDay} from './utils';

const now = new Date(2026, 9, 31, 10, 0);
const task = (id: number, dueAt: string | null, doableStatus = 'pending') =>
  ({id, dueAt, doableStatus, status: 'active', title: `t${id}`}) as FocusTask;

test('leftovers are earlier-day, not-done tasks only', () => {
  const tasks = [
    task(1, '2026-10-30'),
    task(2, new Date(2026, 9, 29, 18).toISOString()),
    task(3, '2026-10-30', 'completed'),
    task(4, '2026-10-31'), // today, not a leftover
    task(5, null),
  ];
  expect(leftoverTasks(tasks, now).map(t => t.id)).toEqual([1, 2]);
});

test('moving keeps the time of day', () => {
  expect(moveToDay('2026-10-29', now)).toBe('2026-10-31');
  const moved = moveToDay(new Date(2026, 9, 29, 18, 30).toISOString(), now);
  expect(new Date(moved).getTime()).toBe(new Date(2026, 9, 31, 18, 30).getTime());
});
