import {useCallback} from 'react';

import {withBehavior} from '@/behaviors/data';
import type {CaptureItemDraft} from '@/capture/captureItemDraft';
import type {ShareKind} from '@/capture/queue';
import {classifyText} from '@/classifier';
import {useLlamaModel} from '@/hooks/useLlamaModel';
import {rawThought, titleFromText} from '@/selectiveKnowledge/agent';
import {isList, splitByLines} from '@/selectiveKnowledge/split';

/** Below this, a guessed to-do is saved as unsure and asked about (QuickCheck) before it can take over Focus. */
const SURE = 0.2;

/**
 * One thought → one draft, typed by the on-device classifier (src/classifier); plain function so the capture queue can
 * run it off-screen. `kind`: the user's own pick when sharing, which beats the classifier.
 * ponytail: type and title only — the agent's dates, repeats and reminders come back with the parser (#5).
 */
export async function analyzeText(text: string, _onStep?: (steps: string[]) => void, _now = new Date(), kind?: ShareKind): Promise<CaptureItemDraft> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('No text to analyze');
  }

  const result = kind ? null : classifyText(trimmed);
  const typeName = kind === 'todo' ? 'Task' : kind ? 'Note' : result?.label ?? 'Note';
  let draft: CaptureItemDraft = {...rawThought(trimmed), typeName, title: titleFromText(trimmed)};
  if (typeName === 'Task') {
    draft = {...draft, unsure: !!result && result.confidence < SURE, behaviorData: {Doable: {status: 'pending', due_at: '', estimated_minutes: ''}}};
  }
  // "Read later" / "remember": comes back on the come-back card.
  if (kind === 'read' || kind === 'remember') {
    draft = withBehavior(draft, 'Memorable', {});
  }
  return draft;
}

/** A typed list (one thought per line) → its lines; anything else stays one thought. */
export async function splitCapture(text: string): Promise<string[]> {
  const lines = splitByLines(text);
  return isList(lines) ? lines : [text.trim()];
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
