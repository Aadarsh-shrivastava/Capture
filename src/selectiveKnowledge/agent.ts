import {withBehavior} from '@/behaviors/data';
import {inferDueAtFromText} from '@/capture/captureDateContext';
import type {CaptureItemDraft} from '@/capture/captureItemDraft';
import {getDefaultBehaviorsForType, typeAllowsBehavior, typeHasBehavior} from '@/domain/behaviorTypeConfig';
import {ITEM_MASCOT_KEYS, ITEM_MASCOTS, isItemMascot} from '@/mascot/itemMascots';
import type {ItemTypeName} from '@/ui/itemTypeConfig';

import {extractRemind, extractRepeat, extractSteps, firstOccurrence, inventedWords, kindFromWords, stripDates} from './extract';
import {findKnowledge, type KnowledgeStep} from './knowledge';
import {STOPWORDS} from './stopwords';

type Message = {role: 'system' | 'user'; content: string};

/** Same shape as useLlamaModel().complete, so the agent stays independent of the hook. */
export type Complete = (messages: Message[], onToken?: undefined, nPredict?: number, grammar?: string) => Promise<string>;

/** GBNF that only allows one of these exact answers. */
export const oneOf = (options: string[]) => `root ::= ${options.map(o => JSON.stringify(o)).join(' | ')}`;

export type GroupHint = {name: string; description?: string | null; keywords?: string[]};


export type AgentOptions = {
  now?: Date;
  onStep?: (journey: string[]) => void;
  groups?: GroupHint[];
  /** The user said what it is (when sharing): to do / read later / remember / just keep. Overrides any judging. */
  kind?: 'todo' | 'read' | 'remember' | 'keep';
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

const NONE_RE = /^(none|n\/a|null|nothing)?$/i;

function cleanAnswer(raw: string): string {
  const line = raw.trim().split('\n')[0] ?? '';
  return line.replace(/^(answer|title|description)\s*:\s*/i, '').replace(/^["'`]+|["'`]+$/g, '').trim();
}

function isEmpty(answer: string): boolean {
  return NONE_RE.test(answer.replace(/\.$/, ''));
}

const URL_RE = /https?:\/\/[^\s<>"{}|\\^`[\]]+/i;

/** The model gave no usable type: the caller retries later, or saves the raw thought. */
export class NoTypeError extends Error {}

/** "I need to", "remind me to"… — how people start a task, not part of its title. */
const LEADING_FILLER = /^(?:(?:i\s+)?(?:need|have|got|want)\s+to|(?:i\s+)?(?:must|should)|remind\s+me\s+to|don'?t\s+forget\s+to|(?:urgent|important|idea|note)\s*[:,-]?)\s+/i;

const sentenceCase = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Title from the user's own words when the model's can't be used: no dates, no "I need to", first six words. */
export function titleFromText(text: string): string {
  const core = stripDates(text).replace(LEADING_FILLER, '').split(/[.!?\n,;:]/)[0];
  const kept = core.split(/\s+/).slice(0, 6);
  // Don't end on "the", "in", "and"…
  while (kept.length > 1 && /^(the|a|an|in|on|at|to|of|for|and|or|with|my|your)$/i.test(kept[kept.length - 1])) kept.pop();
  return sentenceCase(kept.join(' ')) || sentenceCase(text.slice(0, 60));
}

/**
 * Capture agent for ONE thought (the dump was already split). Steps, in order:
 * type → title → description → sticker (model), then date / repeat / reminder / steps / link read from the user's words (code),
 * then priority and group (model). The model only picks from fixed lists or rewrites the user's own words, and every
 * rewrite is checked: one that adds words the user never said is thrown away. Each prompt sees only its own
 * question and the text — earlier answers are logged in the journey, never fed back (the model echoed them).
 */
export async function runSelectiveAgent(
  text: string,
  complete: Complete,
  {now = new Date(), onStep, groups = [], kind}: AgentOptions = {},
): Promise<{draft: CaptureItemDraft; journey: string[]}> {
  const journey: string[] = [];
  const log = (line: string) => {
    journey.push(line);
    onStep?.([...journey]);
  };

  async function ask(step: KnowledgeStep, type: ItemTypeName | undefined, maxTokens: number, extra = '', grammar?: string) {
    try {
      const raw = await complete(
        [
          {role: 'system', content: findKnowledge(step, type).body + extra},
          {role: 'user', content: text},
        ],
        undefined,
        maxTokens,
        grammar,
      );
      return cleanAnswer(raw);
    } catch {
      return '';
    }
  }

  // 1. What kind of thought: something to do → Task (Focus); about the user's own day → Journal; else a plain
  //    thought, which may come back later (Memorable). Clear signals in the user's words decide without the model
  //    (a date or reminder, "felt…", "what if…", "X's number is…"). Otherwise the model judges with yes/no, and a
  //    to-do it only guessed is marked unsure, so the user is asked before it can take over Focus.
  async function judge(step: KnowledgeStep): Promise<boolean> {
    const answer = await ask(step, undefined, 2, '', oneOf(['yes', 'no']));
    if (!answer) throw new NoTypeError(`No answer to "${step}"`);
    return answer === 'yes';
  }
  const saidDue = inferDueAtFromText(text, now);
  // Your pick when sharing beats everything: "read later" is a to-do once you said when, else a thought that comes back.
  const picked = kind === 'todo' || (kind === 'read' && saidDue) ? 'todo' : kind === 'read' || kind === 'remember' ? 'idea' : kind === 'keep' ? 'fact' : null;
  const said = picked ?? kindFromWords(text, now, saidDue);
  const toDo = said ? said === 'todo' : await judge('isTask');
  const aboutDay = said ? said === 'day' : !toDo && (await judge('isDay'));
  const comesBack = said === 'idea' || (said !== 'fact' && !toDo && !aboutDay && (await judge('comesBack')));
  const unsure = toDo && !said;
  const typeName: string = toDo ? 'Task' : aboutDay ? 'Journal' : 'Note';
  log(`thought: ${toDo ? 'something to do' : aboutDay ? 'about your day' : 'a thought'}${comesBack ? ', comes back' : ''}${said ? ` (your words: ${said})` : unsure ? ' (unsure — ask)' : ''}`);

  // In doubt (the model only guessed "to do"): save it now, words as said, and skip the other model steps. Quick
  // check asks the user, and their answer re-runs this with `kind` set (see capture/QuickCheck.tsx).
  if (unsure) {
    const draft: CaptureItemDraft = {
      ...rawThought(text),
      typeName: 'Task',
      title: titleFromText(text),
      content: text.trim(),
      unsure: true,
      behaviorData: {Doable: {status: 'pending', due_at: '', estimated_minutes: ''}},
    };
    log('unsure: saved as said, the rest waits for your answer');
    return {draft, journey};
  }

  const doable = toDo;
  const guideType = doable ? 'Task' : typeName;

  // 2. Title — a few of the user's words. Dates are stripped (they live in the due date); a title with new words is rejected.
  const titleAnswer = stripDates(await ask('title', guideType, 16));
  const titleOk = titleAnswer.length > 0 && titleAnswer.length <= 50 && titleAnswer.split(/\s+/).length <= 6 && inventedWords(titleAnswer, text).length === 0;
  const title = titleOk ? sentenceCase(titleAnswer.replace(/[.!]+$/, '')) : titleFromText(text);
  log(`title: ${title}${titleOk ? '' : ' (from your words)'}`);

  // 3. Description — a task's whole thought with its grammar fixed (adds a word the user never said → their exact words).
  //    Notes, journals and ideas are kept exactly as said: no rewrite.
  const fixed = doable ? await ask('description', undefined, Math.min(160, text.length + 40)) : '';
  const fixedOk = fixed.length > 0 && !isEmpty(fixed) && inventedWords(fixed, text).length === 0;
  const description = fixedOk ? fixed : doable ? sentenceCase(text.trim()) : text.trim();
  // Nothing beyond the title (e.g. "buy groceries"): no description. A note always keeps its raw words.
  const content = doable && inventedWords(description, title).length === 0 ? null : description;
  log(`description: ${content ? content.slice(0, 60) : 'none'}${content && !fixedOk ? ' (your words)' : ''}`);

  // 4. Sticker — one of the 20 poses on the tasks sheet, fixed choice.
  const stickers = ITEM_MASCOT_KEYS.map(k => `- ${k}: ${ITEM_MASCOTS[k]}`).join('\n');
  const sticker = await ask('mascot', undefined, 4, `\n\nStickers:\n${stickers}`, oneOf([...ITEM_MASCOT_KEYS]));
  const mascot = isItemMascot(sticker) ? sticker : null;
  log(`sticker: ${mascot ?? 'none'}`);

  let draft: CaptureItemDraft = {
    typeName: typeName as ItemTypeName,
    title,
    content,
    mascot,
    unsure,
    urgency: null,
    importance: null,
    tagNames: [],
    groupNames: [],
    optionalBehaviorNames: [],
    behaviorData: {},
  };

  if (doable) {
    // 5. Facts the user said, read from their words: due date, repeat, reminder, steps.
    const repeat = typeAllowsBehavior(typeName, 'Repeatable') ? extractRepeat(text) : null;
    let dueAt = saidDue;
    if (!dueAt && repeat) dueAt = firstOccurrence(repeat, now); // a repeat needs a first day to roll forward from
    draft.behaviorData = {Doable: {status: 'pending', due_at: dueAt, estimated_minutes: ''}};
    log(`due: ${dueAt || 'none'}`);
    const facts: [string, Record<string, string> | null][] = [
      ['Repeatable', repeat],
      ['Remindable', extractRemind(text)],
      ['Divisible', extractSteps(text)],
    ];
    for (const [behavior, data] of facts) {
      if (data && typeAllowsBehavior(typeName, behavior)) {
        draft = withBehavior(draft, behavior, data);
        log(`${behavior}: ${JSON.stringify(data)}`);
      }
    }

    // 6. Priority — fixed choice.
    const priority = await ask('priority', typeName, 4, '', oneOf(['urgent', 'important', 'both', 'normal']));
    draft.urgency = /urgent|both/.test(priority) ? 5 : null;
    draft.importance = /important|both/.test(priority) ? 5 : null;
    log(`priority: ${priority || 'normal'}`);
  }

  // A link in the text is kept as-is (copied, not inferred).
  const url = text.match(URL_RE)?.[0];
  if (url && typeAllowsBehavior(typeName, 'Visitable')) {
    draft = withBehavior(draft, 'Visitable', {url, title});
    if (getDefaultBehaviorsForType(typeName).includes('Visitable')) {
      draft.optionalBehaviorNames = draft.optionalBehaviorNames?.filter(n => n !== 'Visitable');
    }
  }

  // 7. Group — only when the user has groups; fixed choice, NONE allowed.
  if (groups.length > 0) {
    const list = groups.map(g => `- ${g.name}${g.description ? `: ${g.description}` : ''}`).join('\n');
    const picked = matchGroup(await ask('group', typeName, 12, `\n\nGroups:\n${list}`, oneOf([...groups.map(g => g.name), 'NONE'])), groups, text);
    if (picked) draft.groupNames = [picked];
    log(`group: ${picked ?? 'none'}`);
  }

  // Comes back later on the come-back card (how often: decided by kind, see resurface/schedule.ts).
  if (comesBack && typeAllowsBehavior(typeName, 'Memorable')) draft = withBehavior(draft, 'Memorable', {});

  return {draft, journey};
}

/** The model failed on this thought too often: keep the exact words as a Note, so nothing is lost. */
export function rawThought(text: string): CaptureItemDraft {
  return {typeName: 'Note', title: text.slice(0, 60), content: text, tagNames: [], groupNames: [], optionalBehaviorNames: [], behaviorData: {}};
}
