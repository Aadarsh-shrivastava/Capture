import {useCallback} from 'react';

import {buildCaptureSystemPrompt} from '@/capture/buildCaptureSystemPrompt';
import {analyzeCaptureText} from '@/capture/captureHeuristics';
import {parseCaptureJson, type CaptureItemDraft} from '@/capture/captureItemDraft';
import {normalizeCaptureDraftTitle} from '@/capture/captureTitle';
import {useLlamaModel} from '@/hooks/useLlamaModel';

/** Shared capture analysis pipeline — Qwen LLM with heuristics fallback. */
export function useCaptureAnalysis() {
  const {ready, busy, loadModel, complete} = useLlamaModel();

  const analyzeText = useCallback(
    async (text: string): Promise<CaptureItemDraft> => {
      const trimmed = text.trim();
      if (!trimmed) {
        throw new Error('No text to analyze');
      }

      const now = new Date();

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
    [ready, complete],
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
