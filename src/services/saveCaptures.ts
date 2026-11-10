import {itemApi} from '@/api/itemApi';
import type {CaptureItemDraft} from '@/capture/captureItemDraft';
import {learnTypeKeywords} from '@/itemTypes';
import {createItemFromCaptureDraft} from '@/services/captureItemService';
import {showUndo} from '@/undo';

export type SavedCapture = {id: number; title: string; draft: CaptureItemDraft};

/** One "Saved · Undo" for all of them. */
export function announceSaved(saved: SavedCapture[]): void {
  if (saved.length === 0) return;
  // Say where it went: to-dos land in Focus, everything else in Thoughts.
  const where = (s: SavedCapture) => (s.draft.typeName === 'Task' ? 'Focus' : 'Thoughts');
  const label =
    saved.length === 1
      ? `Added to ${where(saved[0])}: "${saved[0].title}"`
      : `Added ${saved.length}: ${saved.filter(s => where(s) === 'Focus').length} to Focus, ${saved.filter(s => where(s) === 'Thoughts').length} to Thoughts`;
  showUndo(label, () => Promise.all(saved.map(s => itemApi.deleteItem(s.id))), 'happy');
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
