import type {ItemWithType} from '@/models/item';

import {filterTasks, sortForList, type TaskState} from './itemListing';

const item = (id: number, typeName: string, createdAt: string) => ({id, typeName, createdAt, title: `i${id}`}) as ItemWithType;

test('tasks: open by due date, undated next, completed last', () => {
  const items = [item(1, 'Task', '2026-10-01'), item(2, 'Task', '2026-10-02'), item(3, 'Task', '2026-10-03'), item(4, 'Task', '2026-10-04')];
  const tasks = new Map<number, TaskState>([
    [1, {dueAt: '2026-11-05', status: 'pending'}],
    [2, {dueAt: null, status: 'pending'}],
    [3, {dueAt: '2026-11-01', status: 'pending'}],
    [4, {dueAt: '2026-10-30', status: 'completed'}],
  ]);
  expect(sortForList(items, 'Task', 'due', tasks).map(i => i.id)).toEqual([3, 1, 2, 4]);
  expect(sortForList(items, 'Task', 'created', tasks).map(i => i.id)).toEqual([3, 2, 1, 4]);
});

test('journals: newest first', () => {
  const items = [item(1, 'Journal', '2026-10-01'), item(2, 'Journal', '2026-10-05')];
  expect(sortForList(items, 'Journal', 'due', new Map()).map(i => i.id)).toEqual([2, 1]);
});

test('status filter', () => {
  const items = [item(1, 'Task', '2026-10-01'), item(2, 'Task', '2026-10-02')];
  const tasks = new Map<number, TaskState>([[1, {dueAt: null, status: 'completed'}], [2, {dueAt: null, status: 'pending'}]]);
  expect(filterTasks(items, 'done', tasks).map(i => i.id)).toEqual([1]);
  expect(filterTasks(items, 'open', tasks).map(i => i.id)).toEqual([2]);
  expect(filterTasks(items, 'all', tasks)).toHaveLength(2);
});
