import moment from 'moment';

import {itemApi} from '@/api/itemApi';
import {getDefaultFieldValues} from '@/domain/behaviorDefinitions';
import type {BehaviorDataMap, ItemFull, SaveItemPayload} from '@/models/behaviorData';

export type PriorityLevel = 'none' | 'low' | 'medium' | 'high';

export const PRIORITY_IMPORTANCE: Record<PriorityLevel, number | null> = {
  none: null,
  low: 2,
  medium: 3,
  high: 5,
};

export function priorityFromImportance(importance: number | null): PriorityLevel {
  if (importance == null) return 'none';
  if (importance <= 2) return 'low';
  if (importance <= 4) return 'medium';
  return 'high';
}

export function priorityLabel(level: PriorityLevel): string {
  switch (level) {
    case 'low':
      return 'Low';
    case 'medium':
      return 'Medium';
    case 'high':
      return 'High';
    default:
      return 'None';
  }
}

function toPayload(full: ItemFull, overrides: Partial<SaveItemPayload> = {}): SaveItemPayload {
  return {
    typeId: full.typeId,
    title: full.title,
    content: full.content,
    importance: full.importance,
    urgency: full.urgency,
    status: full.status,
    optionalBehaviorIds: full.optionalBehaviorIds,
    behaviorData: full.behaviorData,
    groupIds: full.groupIds,
    tagNames: full.tagNames,
    ...overrides,
  };
}

function withDoable(full: ItemFull, changes: Record<string, string>): BehaviorDataMap {
  return {
    ...full.behaviorData,
    Doable: {
      ...getDefaultFieldValues('Doable'),
      ...(full.behaviorData.Doable ?? {}),
      ...changes,
    },
  };
}

/** Merge a new date into an existing due value, keeping its time when present. */
function mergeDate(dueAt: string | null | undefined, date: string): string {
  const existing = dueAt?.trim();
  if (existing && existing.includes('T')) {
    const current = moment(existing);
    const next = moment(date, 'YYYY-MM-DD');
    if (current.isValid() && next.isValid()) {
      next.hour(current.hour()).minute(current.minute()).second(0);
      return next.format();
    }
  }
  return date;
}

export const itemDetailService = {
  async setPriority(full: ItemFull, level: PriorityLevel) {
    await itemApi.saveItem(toPayload(full, {importance: PRIORITY_IMPORTANCE[level]}), full.id);
  },

  async setTags(full: ItemFull, tagNames: string[]) {
    await itemApi.saveItem(toPayload(full, {tagNames}), full.id);
  },

  async setContent(full: ItemFull, content: string) {
    await itemApi.saveItem(toPayload(full, {content: content || null}), full.id);
  },

  async setDueDate(full: ItemFull, date: string) {
    const dueAt = mergeDate(full.behaviorData.Doable?.due_at, date);
    await itemApi.saveItem(toPayload(full, {behaviorData: withDoable(full, {due_at: dueAt})}), full.id);
  },

  async clearDue(full: ItemFull) {
    await itemApi.saveItem(toPayload(full, {behaviorData: withDoable(full, {due_at: ''})}), full.id);
  },

  async setCompleted(full: ItemFull, completed: boolean) {
    await itemApi.saveItem(
      toPayload(full, {
        behaviorData: withDoable(full, {status: completed ? 'completed' : 'pending'}),
      }),
      full.id,
    );
  },
};
