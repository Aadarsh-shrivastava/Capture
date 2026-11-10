import moment from 'moment';

import {encode} from '@/behaviors/data';
import {inferRepeatUnit} from '@/recurrence/utils';

import {parseRemind, parseSteps} from './behaviorSteps';
import {STOPWORDS} from './stopwords';

/*
 * Facts the user stated — repeats, reminders, steps, dates in titles — read straight from their words.
 * The model never re-types these (a small model rewrites "10 minutes" as "1 hour"); nothing here guesses:
 * no signal word in the text = nothing extracted.
 */

const words = (s: string): string[] => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

/** Filler words a rewrite may add — but never a date or time word: "tomorrow" added to a description is a made-up fact. */
const DATE_WORDS = new Set(['today', 'tomorrow', 'tonight', 'week', 'weeks', 'month', 'months', 'day', 'days', 'time']);
const FILLER = new Set([...STOPWORDS].filter(w => !DATE_WORDS.has(w)));

/** One letter added, dropped or changed ("haad" → "had"): a spelling fix, not a new word. */
function oneEditApart(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1 || a === b) return a === b;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const [ra, rb] = [a.slice(i), b.slice(i)];
  return ra.slice(1) === rb.slice(1) || ra.slice(1) === rb || ra === rb.slice(1);
}

/**
 * Words in `output` the user never said: not in the source (same 4-letter stem counts, "leaking" ~ "leaky";
 * a one-letter spelling fix counts), not filler. Used to reject a model's title/description that adds facts.
 */
export function inventedWords(output: string, source: string): string[] {
  const src = words(source);
  const stems = new Set(src.map(w => w.slice(0, 4)));
  return [...new Set(words(output))].filter(
    w =>
      w.length >= 3 &&
      !FILLER.has(w) &&
      !src.includes(w) &&
      !stems.has(w.slice(0, 4)) &&
      !(w.length >= 3 && src.some(s => s.length >= 3 && oneEditApart(w, s))),
  );
}

const DAY_NAMES = '(?:sun|mon|tues|wednes|thurs|fri|satur)day';
const MONTH = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*';

/** When-words: "tomorrow at 6 pm", "by friday", "next week", "in 2 hours", "nov 12", "every monday". */
const DATE_PHRASE = new RegExp(
  [
    `\\b(?:(?:by|on|before|until|this|next|every)\\s+)?(?:today|tonight|tomorrow|${DAY_NAMES}s?|weekends?|week|month)\\b(?:\\s+(?:morning|afternoon|evening|night))?`,
    '\\bin\\s+(?:\\d+|a|an|one|two|three)\\s+(?:minutes?|mins?|hours?|days?|weeks?|months?)\\b',
    `\\b(?:by|on|before)?\\s*${MONTH}\\s+\\d{1,2}(?:st|nd|rd|th)?\\b`,
    '\\b(?:at\\s+)?\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)\\b',
    '\\bat\\s+\\d{1,2}(?::\\d{2})?\\b',
  ].join('|'),
  'gi',
);

/** The text without its when-words (they live in the due date, not the title). */
export function stripDates(text: string): string {
  return text.replace(DATE_PHRASE, ' ').replace(/\s+([,.!?])/g, '$1').replace(/\s{2,}/g, ' ').replace(/^[\s,.:;-]+|[\s,:;-]+$/g, '').trim();
}

/** Says it repeats: every / each / daily / weekly / monthly / on weekends / on mondays. A plain "monday" is a date, not a repeat. */
const REPEAT_SIGNAL = new RegExp(`\\b(every|each|daily|weekly|monthly|weekdays|weekends)\\b|\\bon\\s+${DAY_NAMES}s\\b`, 'i');
const WEEKDAY_INDEX: Record<string, number> = {sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6};

export function extractRepeat(text: string): Record<string, string> | null {
  const lower = text.toLowerCase();
  if (!REPEAT_SIGNAL.test(lower)) return null;
  // Full day names only, so "monthly" is not Monday.
  const days = /\bweekdays\b/.test(lower)
    ? [1, 2, 3, 4, 5]
    : /\bweekends?\b/.test(lower)
      ? [0, 6]
      : [...new Set((lower.match(new RegExp(`\\b${DAY_NAMES}`, 'g')) ?? []).map(d => WEEKDAY_INDEX[d.slice(0, 3)]))].sort();
  const unit = days.length ? 'week' : inferRepeatUnit(lower);
  return {interval_value: '1', interval_unit: unit, days: encode(unit === 'week' ? days : [])};
}

/** "remind me 10 minutes before" → [10]. Only the words after "remind/ping/alert/notify me" count, so "in 2 hours" is never a reminder. */
export function extractRemind(text: string): Record<string, string> | null {
  const after = text.toLowerCase().match(/\b(?:remind|ping|alert|notify)\s+me\b(.*)$/)?.[1];
  if (!after || !/\b(before|earlier|ahead|prior|at the time)\b/.test(after)) return null;
  return parseRemind(after);
}

/** A list after a colon ("plan the party: venue, cake, invites") or a "then" chain. A time like 9:30 is not a colon list. */
export function extractSteps(text: string): Record<string, string> | null {
  const colon = text.match(/[a-z)]\s*:\s+(.+)$/i)?.[1];
  if (colon && /[,;]|\band\b/.test(colon)) return parseSteps(colon);
  if (/\bthen\b/i.test(text)) return parseSteps(text);
  return null;
}

/** A repeat with no date said starts on its first day: the next listed weekday (today counts), else today. */
export function firstOccurrence(repeat: Record<string, string>, now: Date): string {
  const days: number[] = JSON.parse(repeat.days || '[]');
  const ahead = days.length ? Math.min(...days.map(d => (d - now.getDay() + 7) % 7)) : 0;
  return moment(now).add(ahead, 'days').format('YYYY-MM-DD');
}

/** "felt", "had fun", "today was", "we went"… — telling what happened (but "had to" is an obligation, not the past). */
const DAY_WORDS = /\b(?:i|we)\s+(?:felt|was|were|ha+d(?!\s+to\b)|went|met|enjoyed|loved|saw)\b|\btoday was\b|\bfelt\b/i; // ha+d: "haad" typed fast
/** Thinking out loud. */
const IDEA_WORDS = /^\s*idea\b|\bwhat if\b|\bmaybe\b|\bimagine\b|\bi wonder\b|\bwouldn'?t it be\b|\bcould we\b/i;
/** A fact to keep: "X's number is…", "the wifi password is…", "… is the capital of…". */
const FACT_WORDS = /\b(?:number|password|code|address|size|capital|birthday|email|phone|pin)\b[^.?!]*\b(?:is|are)\b|\b(?:is|are)\s+the\s+(?:capital|address)\b/i;

export type Kind = 'todo' | 'day' | 'idea' | 'fact';

/**
 * What the user's own words already say it is — certain, no model needed. In this order: telling about their day;
 * a date, time, reminder or repeat (something to do); thinking out loud (an idea); a fact. Nothing clear → null,
 * and the model judges.
 */
export function kindFromWords(text: string, now: Date, dueAt: string): Kind | null {
  if (DAY_WORDS.test(text)) return 'day';
  if (dueAt || extractRemind(text) || extractRepeat(text)) return 'todo';
  if (IDEA_WORDS.test(text)) return 'idea';
  if (FACT_WORDS.test(text)) return 'fact';
  return null;
}
