import moment from 'moment';

import type {ItemWithType} from '@/models/item';

export type TaskSort = 'due' | 'created';

export const TASK_SORT_OPTIONS: {label: string; value: TaskSort}[] = [
  {label: 'Due date', value: 'due'},
  {label: 'Date created', value: 'created'},
];

export type TaskFilter = 'all' | 'open' | 'done';

export const TASK_FILTER_OPTIONS: {label: string; value: TaskFilter}[] = [
  {label: 'All', value: 'all'},
  {label: 'Open', value: 'open'},
  {label: 'Done', value: 'done'},
];

export type TaskState = {dueAt: string | null; status: string};

/** Keep tasks matching the status filter. */
export function filterTasks(items: ItemWithType[], filter: TaskFilter, tasks: Map<number, TaskState>): ItemWithType[] {
  if (filter === 'all') return items;
  return items.filter(i => (tasks.get(i.id)?.status === 'completed') === (filter === 'done'));
}

const isDone = (s?: TaskState) => s?.status === 'completed';
const newestFirst = (a: ItemWithType, b: ItemWithType) => moment(b.createdAt).valueOf() - moment(a.createdAt).valueOf();

/**
 * Doable items (tasks, custom doable types): open first (by due date soonest, undated after, or newest when sorting by created), completed last.
 * Everything else: newest first.
 */
export function sortForList(items: ItemWithType[], doable: boolean, sort: TaskSort, tasks: Map<number, TaskState>): ItemWithType[] {
  if (!doable) return [...items].sort(newestFirst);
  const due = (i: ItemWithType) => {
    const d = tasks.get(i.id)?.dueAt;
    return d ? moment(d).valueOf() : Infinity;
  };
  return [...items].sort((a, b) => {
    const doneDiff = Number(isDone(tasks.get(a.id))) - Number(isDone(tasks.get(b.id)));
    if (doneDiff) return doneDiff;
    if (sort === 'due') return due(a) - due(b) || newestFirst(a, b);
    return newestFirst(a, b);
  });
}
