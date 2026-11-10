import moment from 'moment';

import type {ItemWithType} from '@/models/item';

import {groupByDay, thoughtLabel} from './thoughts';

test('label comes from what is attached, not a picked type', () => {
  expect(thoughtLabel('Task', false)).toBe('To do');
  expect(thoughtLabel('Journal', false)).toBe('Your day');
  expect(thoughtLabel('Note', true)).toBe('Thought · comes back');
  expect(thoughtLabel('Note', false)).toBe('Thought');
  expect(thoughtLabel('Apply', false)).toBe('Apply');
});

test('newest first, grouped by day', () => {
  const now = moment(new Date(2026, 10, 9, 18));
  const item = (id: number, d: Date) => ({id, createdAt: d.toISOString()}) as ItemWithType;
  const groups = groupByDay([item(1, new Date(2026, 10, 8, 9)), item(2, new Date(2026, 10, 9, 8)), item(3, new Date(2026, 10, 9, 17))], now);
  expect(groups.map(g => [g.heading, g.items.map(i => i.id)])).toEqual([
    ['Today', [3, 2]],
    ['Yesterday', [1]],
  ]);
});
