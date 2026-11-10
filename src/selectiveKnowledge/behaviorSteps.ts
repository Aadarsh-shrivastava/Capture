import {encode} from '@/behaviors/data';
import {inferRepeatUnit} from '@/recurrence/utils';

/** Data for one behavior (string fields, lists JSON-encoded), or null = not detected. */
type Parsed = Record<string, string> | null;

const WEEKDAYS: Record<string, number> = {sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6};
const isNone = (a: string) => !a.trim() || /^none\b/i.test(a.trim());

export function parseRepeat(answer: string): Parsed {
  const lower = answer.toLowerCase();
  if (isNone(lower) || !/\b(daily|weekly|monthly|every|each|weekdays?|weekends?|mon|tue|wed|thu|fri|sat|sun)/.test(lower)) return null;
  const days = /\bweekdays?\b/.test(lower)
    ? [1, 2, 3, 4, 5]
    : /\bweekends?\b/.test(lower)
      ? [0, 6]
      : [...new Set((lower.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tues?|wed|thu(?:rs?)?|fri|sat)s?\b/g) ?? []).map(d => WEEKDAYS[d.slice(0, 3)]))];
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
