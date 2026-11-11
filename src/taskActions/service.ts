import {itemApi} from '@/api/itemApi';
import {dayKey, encode, parseDays, parseNumbers, parseSteps} from '@/behaviors/data';
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
      ? nextDueAt(before.due_at, repeat.interval_value, repeat.interval_unit, new Date(), parseNumbers(repeat.days))
      : null;
  const after = nextDue ? {...before, status: 'pending', due_at: nextDue} : {...before, status: 'completed'};
  const payload = toSavePayload(full, after);
  if (nextDue && repeat) {
    // The occurrence that was due (not today's date) counts as done — finishing yesterday's gym this morning marks yesterday.
    const day = dayKey(before.due_at);
    payload.behaviorData = {...payload.behaviorData, Repeatable: {...repeat, done: encode([...new Set([...parseDays(repeat.done), day])])}};
  }
  // A repeating checklist starts fresh for the next occurrence.
  const steps = full.behaviorData.Divisible?.steps;
  if (nextDue && steps) {
    payload.behaviorData = {...payload.behaviorData, Divisible: {steps: encode(parseSteps(steps).map(s => ({...s, done: false})))}};
  }
  await itemApi.saveItem(payload, itemId);
  return {before, nextDue};
}

/** Move a task between pending / in_progress (board columns). Completing goes through completeTask. */
export async function setTaskStatus(itemId: number, status: 'pending' | 'in_progress'): Promise<void> {
  const full = await itemApi.getItemFull(itemId);
  await itemApi.saveItem(toSavePayload(full, {...doableOf(full), status}), itemId);
}

/** Replace one attached behavior's data (e.g. ticking a step). */
export async function updateBehaviorData(itemId: number, behavior: string, data: Record<string, string>): Promise<void> {
  const full = await itemApi.getItemFull(itemId);
  const payload = toSavePayload(full);
  await itemApi.saveItem({...payload, behaviorData: {...payload.behaviorData, [behavior]: data}}, itemId);
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
  const payload = toSavePayload(full, doable);
  // Back to an occurrence → it isn't done any more.
  const repeat = full.behaviorData.Repeatable;
  if (repeat?.done && doable.due_at) {
    const day = dayKey(doable.due_at);
    payload.behaviorData = {...payload.behaviorData, Repeatable: {...repeat, done: encode(parseDays(repeat.done).filter(d => d !== day))}};
  }
  await itemApi.saveItem(payload, itemId);
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
