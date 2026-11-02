import {typeHasBehavior} from '@/domain/behaviorTypeConfig';
import {inferDueAtFromText} from '@/capture/captureDateContext';
import {analyzeCaptureText} from '@/capture/captureHeuristics';
import {CAPTURE_TYPE_NAMES, type CaptureItemDraft} from '@/capture/captureItemDraft';
import type {ItemTypeName} from '@/ui/itemTypeConfig';

import {withBehavior} from '@/behaviors/data';
import {typeAllowsBehavior} from '@/domain/behaviorTypeConfig';

import {BEHAVIOR_STEPS} from './behaviorSteps';
import {findKnowledge, type KnowledgeStep} from './knowledge';
import {STOPWORDS} from './stopwords';
import {bestTypeByKeywords} from './typeKeywords';

type Message = {role: 'system' | 'user'; content: string};

/** Same shape as useLlamaModel().complete, so the agent stays independent of the hook. */
export type Complete = (messages: Message[], onToken?: undefined, nPredict?: number) => Promise<string>;

export type GroupHint = {name: string; description?: string | null; keywords?: string[]};

/** A user-made item type the agent can choose (behaviors decide what happens next). */
export type TypeHint = {name: string; description?: string | null; defaults: string[]; optional: string[]; keywords?: string[]};

export type AgentOptions = {
  now?: Date;
  onStep?: (journey: string[]) => void;
  groups?: GroupHint[];
  /** Custom (non-built-in) types. */
  types?: TypeHint[];
};

const words = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

/**
 * Guard against the small model's bias to always pick something: the text must share
 * a word (or 4-letter prefix) with the option's name or description.
 */
export function hintFitsText(group: GroupHint, text: string): boolean {
  const textWords = words(text);
  const hints = words(`${group.name} ${group.description ?? ''} ${(group.keywords ?? []).join(' ')}`).filter(
    w => w.length >= 2 && !STOPWORDS.has(w),
  );
  return hints.some(h => textWords.some(t => t === h || (h.length >= 4 && t.length >= 4 && t.slice(0, 4) === h.slice(0, 4))));
}

/**
 * Model answer → an existing option that also fits the text, or null. Lenient about wrapping
 * ("Type: Apply", "**Apply**", "apply.") — the option's name just has to appear as a word.
 */
export function matchGroup(answer: string, groups: GroupHint[], text: string): string | null {
  const a = ` ${answer.toLowerCase().replace(/[^a-z0-9]+/g, ' ')} `;
  const group = groups.find(g => a.includes(` ${g.name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `));
  return group && hintFitsText(group, text) ? group.name : null;
}

/** "job applications · can be completed, has a link" — what the model reads for a custom type. */
function describeType(t: TypeHint): string {
  const abilities = [
    t.defaults.includes('Doable') ? 'can be completed (has a due date)' : '',
    t.defaults.includes('Notable') ? 'mainly text/notes' : '',
    t.optional.includes('Visitable') || t.defaults.includes('Visitable') ? 'can hold a link' : '',
  ].filter(Boolean);
  const examples = (t.keywords ?? []).slice(0, 8).join(', ');
  return [t.description || t.name, examples && `e.g. ${examples}`, abilities.join(', ')].filter(Boolean).join(' · ');
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
  {now = new Date(), onStep, groups = [], types = []}: AgentOptions = {},
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

  // 1. Type — first the 4 built-ins (small, reliable choice)…
  const typeAnswer = (await ask('type', undefined, 8)).toLowerCase();
  const pickedType = CAPTURE_TYPE_NAMES.find(t => typeAnswer.includes(t.toLowerCase()));
  const builtIn = pickedType ?? analyzeCaptureText(text, undefined, now).typeName;
  let typeName: string = builtIn;

  // …then offer the user's own types that share a word with the text (any kind — a link can make
  // step 1 say "Note" for what is really a doable "Apply"). Each comes with its description and abilities.
  const candidates = types.filter(t => hintFitsText(t, text));
  if (candidates.length > 0) {
    const list = candidates.map(t => `- ${t.name}: ${describeType(t)}`).join('\n');
    const custom = matchGroup(await ask('customType', undefined, 12, `\n\nTypes:\n${list}`), candidates, text);
    // Model hedged (NONE / garbled)? A clear keyword winner still decides.
    typeName = custom ?? bestTypeByKeywords(candidates, text)?.name ?? typeName;
  }
  log(`type: ${typeName}${typeName !== builtIn ? ` (your type, like ${builtIn})` : pickedType ? '' : ' (heuristic)'}`);

  // Guides are chosen by behavior, so custom doable types get task-style titles/descriptions.
  const guideType = typeHasBehavior(typeName, 'Doable') ? 'Task' : typeName;

  // Heuristic draft for this type: fallback for every later step + tags, groups, behaviors.
  const base = analyzeCaptureText(text, {typeName}, now);

  // 2. Title
  const titleAnswer = await ask('title', guideType, 24);
  const titleOk = titleAnswer && !isEmpty(titleAnswer) && titleAnswer.length <= 60;
  const title = titleOk ? titleAnswer : base.title;
  log(`title: ${title}${titleOk ? '' : ' (heuristic)'}`);

  // 3. Description — only tasks get a model-written one; other types keep the full text.
  let content = base.content ?? null;
  if (typeHasBehavior(typeName, 'Doable')) {
    const answer = await ask('description', guideType, 48);
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

  let draft: CaptureItemDraft = {...base, title, content, behaviorData, groupNames};

  // 6+. One step per optional behavior the type allows (Task → repeat, reminders, steps…).
  // Each is skipped without a model call when the text has no signal for it.
  for (const bs of BEHAVIOR_STEPS) {
    if (!typeAllowsBehavior(typeName, bs.behavior) || !bs.gate(text)) continue;
    const answer = await ask(bs.step, typeName, bs.maxTokens);
    // A NONE from the model is respected; only a failed call falls back to reading the raw text.
    const data = answer ? bs.parse(answer) : bs.textFallback === false ? null : bs.parse(text);
    if (data) {
      draft = withBehavior(draft, bs.behavior, data);
      log(`${bs.label}: ${bs.describe(data)}`);
    }
  }

  return {draft, journey};
}
