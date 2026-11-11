import type {FocusTask} from '@/models/focusTask';

import {splitFocusDay} from './focusSections';

const morning = new Date(2026, 9, 31, 8).getTime();
const at = (h: number) => new Date(2026, 9, 31, h).toISOString();
const task = (id: number, dueAt: string | null, urgency: number | null = null) =>
  ({id, dueAt, title: `t${id}`, importance: null, urgency}) as FocusTask;

test('plain day: by time, untimed last', () => {
  const {now, next, later} = splitFocusDay([task(1, at(18)), task(2, '2026-10-31'), task(3, at(9)), task(4, at(12)), task(5, at(20))], morning);
  expect(now?.id).toBe(3);
  expect(next.map(t => t.id)).toEqual([4, 1]);
  expect(later.map(t => t.id)).toEqual([5, 2]);
});

test('urgent untimed beats a relaxed timed task, but not one about to start', () => {
  const urgent = task(1, null, 5);
  expect(splitFocusDay([task(2, at(18)), urgent], morning).now?.id).toBe(1);
  expect(splitFocusDay([task(2, new Date(2026, 9, 31, 8, 30).toISOString()), urgent], morning).now?.id).toBe(2);
});

test('only untimed tasks: first is now, rest later', () => {
  const {now, next, later} = splitFocusDay([task(1, null), task(2, '2026-10-31')], morning);
  expect(now).not.toBeNull();
  expect(next).toHaveLength(1);
  expect(later).toEqual([]);
});

test('a task later today is not Now: it waits in Next and Now stays empty', () => {
  const {now, next} = splitFocusDay([task(1, at(18))], morning);
  expect(now).toBeNull();
  expect(next.map(t => t.id)).toEqual([1]);
});

test('an untimed task takes Now ahead of a later timed one', () => {
  const {now, next} = splitFocusDay([task(1, at(18)), task(2, null)], morning);
  expect(now?.id).toBe(2);
  expect(next.map(t => t.id)).toEqual([1]);
});

test('two tasks about to start: the earlier one is Now, even if the later one is urgent', () => {
  const evening = new Date(2026, 9, 31, 22, 40).getTime();
  const elevenThirty = task(1, new Date(2026, 9, 31, 23, 30).toISOString(), 5);
  const eleven = task(2, at(23));
  const {now, next} = splitFocusDay([elevenThirty, eleven], evening);
  expect(now?.id).toBe(2);
  expect(next.map(t => t.id)).toEqual([1]);
});
