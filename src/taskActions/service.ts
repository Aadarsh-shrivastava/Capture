import {itemApi} from '@/api/itemApi';
import type {SaveItemPayload} from '@/models/behaviorData';
import {isRepeatUnit, nextDueAt} from '@/recurrence';

import {doableOf, postponedDue, toSavePayload} from './utils';

export type CompleteResult = {before: Record<string, string>; nextDue: string | null};

/** Complete a task. Repeating tasks with a due date roll to the next occurrence instead. */
export async function completeTask(itemId: number): Promise<CompleteResult> {
  const full = await itemApi.getItemFull(itemId);
  const before = doableOf(full);
  const repeat = full.behaviorData.Repeatable;
  const nextDue =
    repeat && isRepeatUnit(repeat.interval_unit) && before.due_at
      ? nextDueAt(before.due_at, repeat.interval_value, repeat.interval_unit)
      : null;
  const after = nextDue ? {...before, status: 'pending', due_at: nextDue} : {...before, status: 'completed'};
  await itemApi.saveItem(toSavePayload(full, after), itemId);
  return {before, nextDue};
}

/** Set a new due date/time and make the task active again. */
export async function rescheduleTask(itemId: number, dueAt: string): Promise<void> {
  const full = await itemApi.getItemFull(itemId);
  await itemApi.saveItem(toSavePayload({...full, status: 'active'}, {...doableOf(full), due_at: dueAt}), itemId);
}

/** Push a task's due time later by `hours`. */
export async function postponeTask(itemId: number, hours: number): Promise<CompleteResult> {
  const full = await itemApi.getItemFull(itemId);
  const before = doableOf(full);
  const nextDue = postponedDue(before.due_at, hours);
  await itemApi.saveItem(toSavePayload(full, {...before, status: 'pending', due_at: nextDue}), itemId);
  return {before, nextDue};
}

/** Put a task's Doable block back (undo of complete). */
export async function restoreDoable(itemId: number, doable: Record<string, string>): Promise<void> {
  const full = await itemApi.getItemFull(itemId);
  await itemApi.saveItem(toSavePayload(full, doable), itemId);
}

/** Delete an item, returning what's needed to recreate it (gets a new id). */
export async function deleteItem(itemId: number): Promise<SaveItemPayload> {
  const payload = toSavePayload(await itemApi.getItemFull(itemId));
  await itemApi.deleteItem(itemId);
  return payload;
}

export async function restoreItem(payload: SaveItemPayload): Promise<void> {
  await itemApi.saveItem(payload);
}
