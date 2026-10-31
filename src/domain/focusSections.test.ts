import type {FocusTask} from '@/models/focusTask';

import {splitFocusDay} from './focusSections';

const at = (h: number) => new Date(2026, 9, 31, h).toISOString();
const task = (id: number, dueAt: string | null) => ({id, dueAt, title: `t${id}`, importance: null, urgency: null}) as FocusTask;

test('now = earliest timed, next = 2 timed, later = rest + untimed', () => {
  const {now, next, later} = splitFocusDay([task(1, at(18)), task(2, '2026-10-31'), task(3, at(9)), task(4, at(12)), task(5, at(20))]);
  expect(now?.id).toBe(3);
  expect(next.map(t => t.id)).toEqual([4, 1]);
  expect(later.map(t => t.id)).toEqual([5, 2]);
});

test('only untimed tasks: first is now, rest later', () => {
  const {now, next, later} = splitFocusDay([task(1, null), task(2, '2026-10-31')]);
  expect(now).not.toBeNull();
  expect(next).toEqual([]);
  expect(later).toHaveLength(1);
});
