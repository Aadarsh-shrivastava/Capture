import {useCallback} from 'react';

import type {CaptureItemDraft} from '@/capture/captureItemDraft';
import type {ShareKind} from '@/capture/queue';
import {GROUPS_ENABLED, groupsService} from '@/groups';
import {complete, ensureLoaded, useLlamaModel} from '@/hooks/useLlamaModel';
import {runSelectiveAgent} from '@/selectiveKnowledge/agent';
import {splitThoughts} from '@/selectiveKnowledge/split';

/** The model isn't downloaded or won't load: captures wait in the queue until it is. */
export class ModelUnavailableError extends Error {}

async function requireModel(): Promise<void> {
  // Loads on demand if downloaded (it may have been released after idling).
  if (!(await ensureLoaded())) throw new ModelUnavailableError('AI model not available');
}

/**
 * One thought → one draft, decided by the on-device model; plain function so the capture queue can run it off-screen.
 * `now`: when it was captured — relative dates ("tomorrow") resolve against it.
 */
export async function analyzeText(text: string, onStep?: (steps: string[]) => void, now = new Date(), kind?: ShareKind, basket?: string): Promise<CaptureItemDraft> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('No text to analyze');
  }
  await requireModel();

  const groups = GROUPS_ENABLED ? await groupsService.getActiveGroups().catch(() => []) : [];
  const {draft, journey} = await runSelectiveAgent(trimmed, complete, {now, onStep, groups, kind, basket});
  if (__DEV__) console.log('[selective-knowledge]', journey.join(' → '));
  return draft;
}

/** A brain dump → one part per thought ("protein shake… btw what is xyz…" → 2). Only this step runs before "Captured". */
export async function splitCapture(text: string): Promise<string[]> {
  await requireModel();
  return splitThoughts(text.trim(), complete);
}

/** Model state for the capture screens. */
export function useCaptureAnalysis() {
  const {ready, busy, loadModel} = useLlamaModel();

  const preloadModel = useCallback(() => {
    if (!ready && !busy) {
      loadModel().catch(() => undefined);
    }
  }, [ready, busy, loadModel]);

  return {
    ready,
    busy,
    analyzing: busy,
    loadModel,
    preloadModel,
  };
}
