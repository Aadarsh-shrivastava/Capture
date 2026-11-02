import {encode} from '@/behaviors/data';
import {inferRepeatUnit} from '@/recurrence/utils';

import type {KnowledgeStep} from './knowledge';

/** Data for one behavior (string fields, lists JSON-encoded), or null = not detected. */
type Parsed = Record<string, string> | null;

export type BehaviorStep = {
  behavior: string;
  step: KnowledgeStep;
  label: string;
  maxTokens: number;
  /** Cheap check on the raw text; no signal = no model call at all. */
  gate: (text: string) => boolean;
  /** Turn an answer (or, as fallback, the raw text) into behavior data. */
  parse: (answer: string) => Parsed;
  describe: (data: Record<string, string>) => string;
  /** Parse the raw text when the model call fails. Off where text-splitting is too unreliable. */
  textFallback?: boolean;
};

const WEEKDAYS: Record<string, number> = {sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6};
const isNone = (a: string) => !a.trim() || /^none\b/i.test(a.trim());

export function parseRepeat(answer: string): Parsed {
  const lower = answer.toLowerCase();
  if (isNone(lower) || !/\b(daily|weekly|monthly|every|each|weekdays?|weekends?|mon|tue|wed|thu|fri|sat|sun)/.test(lower)) return null;
  const days = /\bweekdays?\b/.test(lower)
    ? [1, 2, 3, 4, 5]
    : /\bweekends?\b/.test(lower)
      ? [0, 6]
      : [...new Set((lower.match(/\b(sun|mon|tue|wed|thu|fri|sat)[a-z]*/g) ?? []).map(d => WEEKDAYS[d.slice(0, 3)]))];
  const unit = days.length ? 'week' : inferRepeatUnit(lower);
  return {interval_value: '1', interval_unit: unit, days: encode(unit === 'week' ? days.sort() : [])};
}

export function parseRemind(answer: string): Parsed {
  const lower = answer.toLowerCase();
  if (isNone(lower)) return null;
  const offsets: number[] = [];
  if (/\b(at the time|on time|when it starts)\b/.test(lower)) offsets.push(0);
  for (const [, n, unit] of lower.matchAll(/(\d+)\s*(min|minute|hr|hour|day)/g)) {
    offsets.push(Number(n) * (unit.startsWith('d') ? 1440 : unit.startsWith('h') ? 60 : 1));
  }
  if (/\ban hour\b/.test(lower)) offsets.push(60);
  if (/\ba day\b/.test(lower)) offsets.push(1440);
  const unique = [...new Set(offsets)].sort((a, b) => b - a);
  return unique.length ? {offsets: encode(unique)} : null;
}

export function parseSteps(answer: string): Parsed {
  if (isNone(answer)) return null;
  const body = answer.includes(':') ? answer.slice(answer.indexOf(':') + 1) : answer;
  const parts = body
    .split(/\n|,|;|\bthen\b|\band\b/i)
    .map(s => s.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(s => s.length > 1 && s.length < 60);
  return parts.length >= 2 ? {steps: encode(parts.slice(0, 8).map(text => ({text: text[0].toUpperCase() + text.slice(1), done: false})))} : null;
}

/** Behavior steps the agent can run. Add a behavior = a knowledge entry + one item here. */
const WEIGHT_WORDS: Record<string, string> = {often: '3', sometimes: '2', rarely: '1', never: '0'};

/** "often" → {weight: '3'} … "never" → {weight: '0'}; anything else = no opinion (Auto stays). */
export function parseWeight(answer: string): Parsed {
  const word = answer.toLowerCase().match(/\b(often|sometimes|rarely|never)\b/)?.[1];
  return word ? {weight: WEIGHT_WORDS[word]} : null;
}

export const BEHAVIOR_STEPS: BehaviorStep[] = [
  {
    behavior: 'Repeatable',
    step: 'repeat',
    label: 'repeats',
    maxTokens: 16,
    gate: t => /\b(every|daily|weekly|monthly|each|weekdays?|weekends?|routine|habit)\b/i.test(t),
    parse: parseRepeat,
    describe: d => (d.days && d.days !== '[]' ? `weekly on ${d.days}` : d.interval_unit === 'day' ? 'daily' : `${d.interval_unit}ly`),
  },
  {
    behavior: 'Remindable',
    step: 'remind',
    label: 'remind',
    maxTokens: 16,
    gate: t => /\b(remind|ping|alert|notify|heads.?up|before)\b/i.test(t),
    parse: parseRemind,
    describe: d => `${d.offsets} min before`,
  },
  {
    behavior: 'Divisible',
    step: 'steps',
    label: 'steps',
    maxTokens: 64,
    gate: t => /[:,;]|\bthen\b|\bsteps?\b|\n/i.test(t),
    parse: parseSteps,
    describe: d => `${JSON.parse(d.steps).length} steps`,
    textFallback: false,
  },
  {
    behavior: 'Memorable',
    step: 'memorable',
    label: 'comes back',
    maxTokens: 4,
    gate: () => true,
    parse: parseWeight,
    describe: d => ({'3': 'often', '2': 'sometimes', '1': 'rarely', '0': 'never'})[d.weight] ?? 'auto',
    textFallback: false,
  },
];
