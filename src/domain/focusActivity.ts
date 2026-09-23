import type {ItemWithType} from '@/models/item';
import type {FocusActivityEvent} from '@/models/focusTask';

const TYPE_VERBS: Record<string, string> = {
  Task: 'Captured a task',
  Note: 'Added a note',
  Journal: 'Added a journal entry',
  Idea: 'Captured an idea',
};

function mapItemToActivityEvent(item: ItemWithType): FocusActivityEvent {
  return {
    id: `created-${item.id}`,
    label: TYPE_VERBS[item.typeName] ?? `Captured ${item.typeName.toLowerCase()}`,
    typeName: item.typeName,
    timestamp: item.createdAt,
  };
}

export function buildRecentActivity(items: ItemWithType[], limit = 8): FocusActivityEvent[] {
  return [...items]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
    .map(mapItemToActivityEvent);
}

/** Full capture history for the Timeline tab. */
export function buildTimelineActivity(items: ItemWithType[]): FocusActivityEvent[] {
  return [...items]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(mapItemToActivityEvent);
}
