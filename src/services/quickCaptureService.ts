import {analyzeCaptureText} from '@/capture/captureHeuristics';
import {normalizeCaptureDraftTitle} from '@/capture/captureTitle';
import {createItemFromCaptureDraft} from '@/services/captureItemService';
import {splitThoughts} from '@/selectiveKnowledge/split';

/** Analyze plain text and persist one item per thought (widget, share target, deep links). */
export async function quickCaptureFromText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Empty text');
  }

  const now = new Date();
  for (const part of await splitThoughts(trimmed)) {
    const draft = analyzeCaptureText(part, undefined, now);
    const {title, content} = normalizeCaptureDraftTitle(draft, part);
    await createItemFromCaptureDraft({...draft, title, content});
  }
}
