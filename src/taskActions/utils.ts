import moment from 'moment';

import {getDefaultFieldValues} from '@/domain/behaviorDefinitions';
import {hasTimeComponent} from '@/ui/formatDateTime';
import type {ItemFull, SaveItemPayload} from '@/models/behaviorData';

/** Save payload that recreates `full` as-is, optionally with a new Doable block. */
export function toSavePayload(full: ItemFull, doable?: Record<string, string>): SaveItemPayload {
  return {
    typeId: full.typeId,
    title: full.title,
    content: full.content,
    mascot: full.mascot,
    importance: full.importance,
    urgency: full.urgency,
    status: full.status,
    optionalBehaviorIds: full.optionalBehaviorIds,
    behaviorData: doable ? {...full.behaviorData, Doable: doable} : full.behaviorData,
    groupIds: full.groupIds,
    tagNames: full.tagNames,
  };
}

export function doableOf(full: ItemFull): Record<string, string> {
  return {...getDefaultFieldValues('Doable'), ...(full.behaviorData.Doable ?? {})};
}

/** Original due time + hours; if that's already past (or there's no time), from now instead. */
export function postponedDue(dueAt: string | null | undefined, hours: number, now = new Date()): string {
  const base = dueAt && hasTimeComponent(dueAt) ? moment(dueAt) : moment(now);
  const pushed = base.add(hours, 'hours');
  return (pushed.isAfter(now) ? pushed : moment(now).add(hours, 'hours')).seconds(0).format();
}
