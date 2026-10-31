import {useCallback} from 'react';

import {buildCaptureSystemPrompt} from '@/capture/buildCaptureSystemPrompt';
import {analyzeCaptureText} from '@/capture/captureHeuristics';
import {parseCaptureJson, type CaptureItemDraft} from '@/capture/captureItemDraft';
import {normalizeCaptureDraftTitle} from '@/capture/captureTitle';
import {groupsService} from '@/groups';
import {useLlamaModel} from '@/hooks/useLlamaModel';
import {runSelectiveAgent} from '@/selectiveKnowledge/agent';
import {useSelectiveKnowledgeStore} from '@/selectiveKnowledge/store';

/** Shared capture analysis pipeline — Qwen LLM with heuristics fallback. */
export function useCaptureAnalysis() {
  const {ready, busy, loadModel, complete} = useLlamaModel();
  const selective = useSelectiveKnowledgeStore(state => state.enabled);

  const analyzeText = useCallback(
    async (text: string, onStep?: (steps: string[]) => void): Promise<CaptureItemDraft> => {
      const trimmed = text.trim();
      if (!trimmed) {
        throw new Error('No text to analyze');
      }

      const now = new Date();

      if (ready && selective) {
        const groups = await groupsService.getActiveGroups().catch(() => []);
        const {draft, journey} = await runSelectiveAgent(trimmed, complete, now, onStep, groups);
        if (__DEV__) console.log('[selective-knowledge]', journey.join(' → '));
        return draft;
      }

      if (ready) {
        try {
          const systemPrompt = buildCaptureSystemPrompt(now);
          const raw = await complete(
            [
              {role: 'system', content: systemPrompt},
              {role: 'user', content: trimmed},
            ],
            undefined,
            768,
          );
          const draft = parseCaptureJson(raw);
          const {title, content} = normalizeCaptureDraftTitle(draft, trimmed);
          return {...draft, title, content};
        } catch {
          return analyzeCaptureText(trimmed, undefined, now);
        }
      }

      return analyzeCaptureText(trimmed, undefined, now);
    },
    [ready, selective, complete],
  );

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
    analyzeText,
    preloadModel,
  };
}
