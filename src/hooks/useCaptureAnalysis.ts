import {useCallback} from 'react';

import {buildCaptureSystemPrompt} from '@/capture/buildCaptureSystemPrompt';
import {analyzeCaptureText} from '@/capture/captureHeuristics';
import {parseCaptureJson, type CaptureItemDraft} from '@/capture/captureItemDraft';
import {normalizeCaptureDraftTitle} from '@/capture/captureTitle';
import {GROUPS_ENABLED, groupsService} from '@/groups';
import {setTypeKeywords, useItemTypesStore} from '@/itemTypes';
import {generateTypeKeywords} from '@/selectiveKnowledge/typeKeywords';
import {useLlamaModel} from '@/hooks/useLlamaModel';
import {runSelectiveAgent} from '@/selectiveKnowledge/agent';
import {splitThoughts} from '@/selectiveKnowledge/split';
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
        const groups = GROUPS_ENABLED ? await groupsService.getActiveGroups().catch(() => []) : [];
        // First capture after a custom type is created/renamed: expand it into keywords once
        // (the model is already loaded here, so no extra load just for this).
        for (const t of useItemTypesStore.getState().types.filter(x => !x.isSystem && x.keywords.length === 0)) {
          onStep?.([`learning your "${t.name}" type…`]);
          const words = await generateTypeKeywords(t, complete);
          if (words.length) await setTypeKeywords(t.id, words);
        }
        // The agent sees the user's own types too (descriptions, keywords, behaviors), not just the built-ins.
        const types = useItemTypesStore
          .getState()
          .types.filter(t => !t.isSystem)
          .map(t => ({name: t.name, description: t.description, defaults: t.defaults, optional: t.optional, keywords: t.keywords}));
        const {draft, journey} = await runSelectiveAgent(trimmed, complete, {now, onStep, groups, types});
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

  /** A brain dump → one draft per thought ("protein shake… btw what is xyz…" → 2 items). */
  const analyzeMany = useCallback(
    async (text: string, onStep?: (steps: string[]) => void): Promise<CaptureItemDraft[]> => {
      const parts = await splitThoughts(text.trim(), ready ? complete : undefined);
      const drafts: CaptureItemDraft[] = [];
      for (const [i, part] of parts.entries()) {
        const prefix = parts.length > 1 ? `${i + 1}/${parts.length} · ` : '';
        drafts.push(await analyzeText(part, steps => onStep?.(steps.map(line => prefix + line))));
      }
      return drafts;
    },
    [ready, complete, analyzeText],
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
    analyzeMany,
    preloadModel,
  };
}
