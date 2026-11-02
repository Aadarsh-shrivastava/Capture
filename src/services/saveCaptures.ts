import {itemApi} from '@/api/itemApi';
import type {CaptureItemDraft} from '@/capture/captureItemDraft';
import {learnTypeKeywords} from '@/itemTypes';
import {createItemFromCaptureDraft} from '@/services/captureItemService';
import {askIfUnsure} from '@/typeCheck';
import {showUndo} from '@/undo';

/** Save analyzed drafts straight away (no review form) with one "Saved · Undo" for all of them. */
export async function saveCaptures(drafts: CaptureItemDraft[]): Promise<void> {
  const saved: {id: number; title: string; draft: CaptureItemDraft}[] = [];
  try {
    for (const draft of drafts) {
      saved.push({...(await createItemFromCaptureDraft(draft)), draft});
      // Custom types keep learning from their items' tags.
      learnTypeKeywords(draft.typeName, draft.tagNames ?? []).catch(() => {});
    }
  } finally {
    if (saved.length > 0) {
      const label = saved.length === 1 ? `Saved "${saved[0].title}"` : `Saved ${saved.length} items`;
      showUndo(label, () => Promise.all(saved.map(s => itemApi.deleteItem(s.id))), 'happy');
      askIfUnsure(saved);
    }
  }
}
