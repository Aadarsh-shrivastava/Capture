import moment from 'moment';

import {itemApi} from '@/api/itemApi';
import {analyzeCaptureText} from '@/capture/captureHeuristics';
import {getDatabase} from '@/db/database';
import {createItemFromCaptureDraft} from '@/services/captureItemService';
import {updateBehaviorData} from '@/taskActions';
import {showUndo} from '@/undo';

import {useDataVersionStore} from '@/store/dataVersionStore';

import {nextState, rank, type Memo, type ResurfaceAction} from './schedule';

/** Every item with Come back (Memorable), with what the scheduler needs. */
export async function loadMemos(): Promise<Memo[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Omit<Memo, 'hasLink'> & {hasLink: number}>(
    `SELECT i.id AS itemId, t.name AS typeName, i.title, i.content, i.created_at AS createdAt,
            m.weight, m.review_at AS reviewAt, m.interval_days AS intervalDays, m.times_shown AS timesShown,
            v.item_id IS NOT NULL AS hasLink
     FROM memorable_items m
     JOIN items i ON i.id = m.item_id
     JOIN item_types t ON t.id = i.type_id
     LEFT JOIN visitable_items v ON v.item_id = i.id`,
  );
  return rows.map(r => ({...r, hasLink: Boolean(r.hasLink)}));
}

const stateOf = (m: Memo): Record<string, string> => ({
  weight: m.weight == null ? '' : String(m.weight),
  review_at: m.reviewAt ?? '',
  interval_days: m.intervalDays == null ? '' : String(m.intervalDays),
  times_shown: String(m.timesShown),
});

/** Record what the user did with a suggestion. "Do it" also creates a task for today (one Undo reverts both). */
export async function act(memo: Memo, action: ResurfaceAction): Promise<void> {
  await updateBehaviorData(memo.itemId, 'Memorable', nextState(memo, action));
  const undo = () => updateBehaviorData(memo.itemId, 'Memorable', stateOf(memo));
  if (action === 'doIt') {
    const draft = analyzeCaptureText(memo.title, {typeName: 'Task'});
    const doable = {...(draft.behaviorData?.Doable ?? {}), status: 'pending', due_at: moment().format('YYYY-MM-DD')};
    const task = await createItemFromCaptureDraft({...draft, title: memo.title, behaviorData: {...draft.behaviorData, Doable: doable}});
    showUndo(`"${memo.title}" added to today`, async () => {
      await itemApi.deleteItem(task.id);
      await undo();
    }, 'happy');
  } else if (action === 'done') {
    showUndo(`"${memo.title}" won't come back`, undo);
  }
}

/** Dev: make every Come back item due now (except ones turned off). Returns how many would show. */
export async function makeAllDue(): Promise<number> {
  const db = await getDatabase();
  const past = new Date(Date.now() - 86400000).toISOString();
  await db.runAsync('UPDATE memorable_items SET review_at = ? WHERE weight IS NULL OR weight > 0', past);
  useDataVersionStore.getState().bump();
  return rank(await loadMemos(), Date.now(), 99).length;
}
