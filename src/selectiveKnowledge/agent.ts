import {typeHasBehavior} from '@/domain/behaviorTypeConfig';
import {inferDueAtFromText} from '@/capture/captureDateContext';
import {analyzeCaptureText} from '@/capture/captureHeuristics';
import {CAPTURE_TYPE_NAMES, type CaptureItemDraft} from '@/capture/captureItemDraft';
import type {ItemTypeName} from '@/ui/itemTypeConfig';

import {findKnowledge, type KnowledgeStep} from './knowledge';

type Message = {role: 'system' | 'user'; content: string};

/** Same shape as useLlamaModel().complete, so the agent stays independent of the hook. */
export type Complete = (messages: Message[], onToken?: undefined, nPredict?: number) => Promise<string>;

export type GroupHint = {name: string; description?: string | null};

const words = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

/**
 * Guard against the small model's bias to always pick something: the text must share
 * a word (or 4-letter prefix) with the group's name or description.
 */
export function groupFitsText(group: GroupHint, text: string): boolean {
  const textWords = words(text);
  const hints = words(`${group.name} ${group.description ?? ''}`).filter(w => w.length >= 3);
  return hints.some(h => textWords.some(t => t === h || (h.length >= 4 && t.length >= 4 && t.slice(0, 4) === h.slice(0, 4))));
}

/** Model answer → an existing group name that also fits the text, or null. */
export function matchGroup(answer: string, groups: GroupHint[], text: string): string | null {
  const a = answer.trim().replace(/\.$/, '').toLowerCase();
  const group = groups.find(g => g.name.toLowerCase() === a);
  return group && groupFitsText(group, text) ? group.name : null;
}

const NONE_RE = /^(none|n\/a|null|nothing)?$/i;

function cleanAnswer(raw: string): string {
  const line = raw.trim().split('\n')[0] ?? '';
  return line.replace(/^(answer|title|description)\s*:\s*/i, '').replace(/^["'`]+|["'`]+$/g, '').trim();
}

function isEmpty(answer: string): boolean {
  return NONE_RE.test(answer.replace(/\.$/, ''));
}

/**
 * Multi-step capture: each step reads one small knowledge file and answers one question.
 * The journey (one line per finished step) is fed to the next step instead of a big prompt.
 * Any step that fails or answers badly falls back to the rule-based heuristics for that field.
 */
export async function runSelectiveAgent(
  text: string,
  complete: Complete,
  now = new Date(),
  onStep?: (journey: string[]) => void,
  groups: GroupHint[] = [],
): Promise<{draft: CaptureItemDraft; journey: string[]}> {
  const journey: string[] = [];
  const log = (line: string) => {
    journey.push(line);
    onStep?.([...journey]);
  };

  async function ask(step: KnowledgeStep, type: ItemTypeName | undefined, maxTokens: number, extra = '') {
    const knowledge = findKnowledge(step, type);
    const progress = journey.length
      ? `\n\nAlready decided:\n${journey.map(line => `- ${line}`).join('\n')}`
      : '';
    try {
      const raw = await complete(
        [
          {role: 'system', content: knowledge.body + extra + progress},
          {role: 'user', content: text},
        ],
        undefined,
        maxTokens,
      );
      return cleanAnswer(raw);
    } catch {
      return '';
    }
  }

  // 1. Type
  const typeAnswer = (await ask('type', undefined, 8)).toLowerCase();
  const pickedType = CAPTURE_TYPE_NAMES.find(t => typeAnswer.includes(t.toLowerCase()));
  const typeName = pickedType ?? analyzeCaptureText(text, undefined, now).typeName;
  log(`type: ${typeName}${pickedType ? '' : ' (heuristic)'}`);

  // Heuristic draft for this type: fallback for every later step + tags, groups, behaviors.
  const base = analyzeCaptureText(text, {typeName}, now);

  // 2. Title
  const titleAnswer = await ask('title', typeName, 24);
  const titleOk = titleAnswer && !isEmpty(titleAnswer) && titleAnswer.length <= 60;
  const title = titleOk ? titleAnswer : base.title;
  log(`title: ${title}${titleOk ? '' : ' (heuristic)'}`);

  // 3. Description — only tasks get a model-written one; other types keep the full text.
  let content = base.content ?? null;
  if (typeHasBehavior(typeName, 'Doable')) {
    const answer = await ask('description', typeName, 48);
    content = answer && !isEmpty(answer) ? answer : null;
  }
  log(`description: ${content ? content.slice(0, 60) : 'none'}`);

  // 4. Date/time — model copies the phrase, existing resolver turns it into a date.
  const behaviorData = {...base.behaviorData};
  if (behaviorData.Doable) {
    const phrase = await ask('datetime', typeName, 16);
    const fromPhrase = phrase && !isEmpty(phrase) ? inferDueAtFromText(phrase, now) : '';
    const dueAt = fromPhrase || behaviorData.Doable.due_at || '';
    behaviorData.Doable = {...behaviorData.Doable, due_at: dueAt};
    log(`due: ${dueAt || 'none'}${phrase && fromPhrase ? ` ("${phrase}")` : ''}`);
  }

  // 5. Group — only when the user has groups. NONE means no group (no heuristic fallback).
  let groupNames: string[] = [];
  if (groups.length > 0) {
    const list = groups.map(g => `- ${g.name}${g.description ? `: ${g.description}` : ''}`).join('\n');
    const picked = matchGroup(await ask('group', typeName, 12, `\n\nGroups:\n${list}`), groups, text);
    if (picked) groupNames = [picked];
    log(`group: ${picked ?? 'none'}`);
  }

  return {draft: {...base, title, content, behaviorData, groupNames}, journey};
}
