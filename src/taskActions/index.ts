import moment from 'moment';

import {showUndo} from '@/undo';

import * as service from './service';
import {usePostponeSettings} from './settings';

export {POSTPONE_OPTIONS, usePostponeSettings} from './settings';
/** Raw delete/restore (no Undo bar) for callers that build their own Undo. */
export {deleteItem as deleteItemForUndo, rescheduleTask, restoreItem} from './service';

/** Complete (or roll a repeating task forward) and offer Undo. */
export async function completeTask(itemId: number, title: string, opts: {undo?: boolean} = {}): Promise<void> {
  const {before, nextDue} = await service.completeTask(itemId);
  if (opts.undo === false) return;
  const label = nextDue ? `Done · next ${moment(nextDue).calendar(null, {sameElse: 'MMM D'})}` : `Completed "${title}"`;
  showUndo(label, () => service.restoreDoable(itemId, before));
}

/** "Later": push the due time by the configured hours, with Undo. */
export async function postponeTask(itemId: number, title: string): Promise<void> {
  const {before, nextDue} = await service.postponeTask(itemId, usePostponeSettings.getState().hours);
  showUndo(`"${title}" moved to ${moment(nextDue).calendar()}`, () => service.restoreDoable(itemId, before));
}

type Named = {id: number; title: string};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Bulk complete; one Undo restores them all. */
export async function completeTasks(tasks: Named[]): Promise<void> {
  const done: {id: number; before: Record<string, string>}[] = [];
  for (const task of tasks) done.push({id: task.id, ...(await service.completeTask(task.id))});
  showUndo(`Completed ${plural(done.length, 'task')}`, async () => {
    for (const d of done) await service.restoreDoable(d.id, d.before);
  });
}

/** Bulk delete; one Undo recreates them all. */
export async function deleteItems(items: Named[]): Promise<void> {
  const payloads: Awaited<ReturnType<typeof service.deleteItem>>[] = [];
  for (const item of items) payloads.push(await service.deleteItem(item.id));
  showUndo(`Deleted ${plural(payloads.length, 'item')}`, async () => {
    for (const p of payloads) await service.restoreItem(p);
  });
}

/** Delete without a confirm dialog; Undo recreates the item. */
export async function deleteItem(itemId: number, title: string): Promise<void> {
  const payload = await service.deleteItem(itemId);
  showUndo(`Deleted "${title}"`, () => service.restoreItem(payload));
}
