import {groupApi} from '@/api/groupApi';
import {itemApi} from '@/api/itemApi';
import type {CaptureItemDraft} from '@/capture/captureItemDraft';
import {learnTypeKeywords, useItemTypesStore} from '@/itemTypes';
import {draftFromItemFull, saveItemDraft} from '@/services/captureItemService';
import {distinctiveWords} from '@/selectiveKnowledge/typeKeywords';

import {useTypeCheckStore} from './store';
import {unsureCandidates} from './unsure';

/** Lets the capture sheet/modal close first (iOS can't present a sheet over another). */
const AFTER_CLOSE_MS = 450;

const textOf = (d: Pick<CaptureItemDraft, 'title' | 'content'>) => `${d.title} ${d.content ?? ''}`.trim();

/** After saving: ask about at most one item whose type was a shaky guess. */
export function askIfUnsure(saved: {id: number; draft: CaptureItemDraft}[]): void {
  const custom = useItemTypesStore.getState().types.filter(t => !t.isSystem);
  if (custom.length === 0) return;
  for (const {id, draft} of saved) {
    const text = textOf(draft);
    const candidates = unsureCandidates(text, draft.typeName, custom);
    if (!candidates) continue;
    const question = {itemId: id, title: draft.title, text, current: draft.typeName, candidates};
    setTimeout(() => useTypeCheckStore.getState().set(question), AFTER_CLOSE_MS);
    return;
  }
}

/** A user correction teaches the chosen (custom) type this text's distinctive words. */
export function learnFromCorrection(typeName: string, text: string): void {
  learnTypeKeywords(typeName, distinctiveWords(text)).catch(() => {});
}

/** Answer: move the item to `typeName` (if different) and learn from it. */
export async function answer(typeName: string): Promise<void> {
  const q = useTypeCheckStore.getState().question;
  useTypeCheckStore.getState().set(null);
  if (!q || typeName === q.current) return;
  const [full, groups] = await Promise.all([itemApi.getItemFull(q.itemId), groupApi.getGroups()]);
  await saveItemDraft({...draftFromItemFull(full, groups), typeName}, q.itemId);
  learnFromCorrection(typeName, q.text);
}
