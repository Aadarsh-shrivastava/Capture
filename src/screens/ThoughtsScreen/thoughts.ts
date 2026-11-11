import moment from 'moment';

import type {ItemWithType} from '@/models/item';

/**
 * What a thought turned into, from what's attached to it (there's no type to pick at capture):
 * something to do → "To do", about the user's day → "Your day", else a thought (that may come back).
 * A custom type the user set shows its own name.
 */
export function thoughtLabel(typeName: string, comesBack: boolean): string {
  if (typeName === 'Task') return 'To do';
  if (typeName === 'Journal') return 'Your day';
  if (typeName === 'Note' || typeName === 'Idea') return comesBack ? 'Thought · comes back' : 'Thought';
  return typeName;
}

/** "Today", "Yesterday", "Mon, Nov 3". */
export function dayHeading(iso: string, now = moment()): string {
  const day = moment(iso);
  if (day.isSame(now, 'day')) return 'Today';
  if (day.isSame(now.clone().subtract(1, 'day'), 'day')) return 'Yesterday';
  return day.format(day.isSame(now, 'year') ? 'ddd, MMM D' : 'ddd, MMM D, YYYY');
}

/** Newest first, grouped by the day they were said. */
export function groupByDay(items: ItemWithType[], now = moment()): {heading: string; items: ItemWithType[]}[] {
  const groups: {heading: string; items: ItemWithType[]}[] = [];
  for (const item of [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    const heading = dayHeading(item.createdAt, now);
    const last = groups[groups.length - 1];
    if (last?.heading === heading) last.items.push(item);
    else groups.push({heading, items: [item]});
  }
  return groups;
}
