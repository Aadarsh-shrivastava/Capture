import {analyzeCaptureText} from '@/capture/captureHeuristics';
import {normalizeCaptureDraftTitle} from '@/capture/captureTitle';
import {createItemFromCaptureDraft} from '@/services/captureItemService';

/** Analyze plain text and persist an item (widget, share target, deep links). */
export async function quickCaptureFromText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Empty text');
  }

  const now = new Date();
  const draft = analyzeCaptureText(trimmed, undefined, now);
  const {title, content} = normalizeCaptureDraftTitle(draft, trimmed);
  return createItemFromCaptureDraft({...draft, title, content});
}
