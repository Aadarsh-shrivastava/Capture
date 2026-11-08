import {itemApi} from '@/api/itemApi';
import type {CaptureItemDraft} from '@/capture/captureItemDraft';
import {learnTypeKeywords} from '@/itemTypes';
import {createItemFromCaptureDraft} from '@/services/captureItemService';
import {askIfUnsure} from '@/typeCheck';
import {showUndo} from '@/undo';

export type SavedCapture = {id: number; title: string; draft: CaptureItemDraft};

/** One "Saved · Undo" for all of them, plus the shaky-type question. */
export function announceSaved(saved: SavedCapture[]): void {
  if (saved.length === 0) return;
  const label = saved.length === 1 ? `Saved "${saved[0].title}"` : `Saved ${saved.length} items`;
  showUndo(label, () => Promise.all(saved.map(s => itemApi.deleteItem(s.id))), 'happy');
  askIfUnsure(saved);
}

/** Save analyzed drafts straight away (no review form). `announce: false` lets the caller batch the toast. */
export async function saveCaptures(drafts: CaptureItemDraft[], announce = true): Promise<SavedCapture[]> {
  const saved: SavedCapture[] = [];
  try {
    for (const draft of drafts) {
      saved.push({...(await createItemFromCaptureDraft(draft)), draft});
      // Custom types keep learning from their items' tags.
      learnTypeKeywords(draft.typeName, draft.tagNames ?? []).catch(() => {});
    }
  } finally {
    if (announce) announceSaved(saved);
  }
  return saved;
}
