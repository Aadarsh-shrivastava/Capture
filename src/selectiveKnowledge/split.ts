import type {Complete} from './agent';
import {findKnowledge} from './knowledge';

const MAX_PARTS = 8;
const words = (s: string) => s.toLowerCase().match(/[a-z0-9']+/g) ?? [];

/** One thought per line (bullets/numbers stripped): a list the user typed. */
export function splitByLines(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
}

/** A short list reads as separate thoughts; long lines or many of them are one pasted note. */
const isList = (lines: string[]) => lines.length > 1 && lines.length <= MAX_PARTS && lines.every(l => l.length <= 140);

/** Where one thought may end and the next begin: sentence ends, ; , and joining words. */
const JOIN = /[.!?;]+\s+|,\s*(?:and\s+|also\s+|btw\s+|but\s+)?|\s+(?:and also|and then|and|also|btw|by the way|plus|oh and)\s+/gi;
/** Words that only connect, left over at the start of a piece. */
const LEADING = /^(?:and|also|btw|by the way|but|plus|oh and|then)\s+/i;

type Span = {start: number; end: number};

/** Where each piece sits in the text, cut at every possible join (the joins themselves left out). */
function candidateSpans(text: string): Span[] {
  const spans: Span[] = [];
  let start = 0;
  for (const m of text.matchAll(JOIN)) {
    const end = m.index ?? 0;
    if (text.slice(start, end).trim()) spans.push({start, end});
    start = end + m[0].length;
  }
  if (text.slice(start).trim()) spans.push({start, end: text.length});
  return spans;
}

/** A piece as a thought of its own: no leading "and"/"btw", no trailing comma or full stop. */
const tidy = (piece: string) => piece.trim().replace(LEADING, '').replace(/[.,;]+$/, '').trim();

/** The text cut at every possible join — the user's own words, nothing rewritten. */
export function candidateParts(text: string): string[] {
  return candidateSpans(text).map(s => tidy(text.slice(s.start, s.end))).filter(Boolean);
}

/** Too short to hold two thoughts — not worth a model call. */
const MIN_WORDS_TO_SPLIT = 5;
/** A piece this short can't stand alone ("eggs", "by friday"): it belongs to the one before. */
const MIN_PIECE_WORDS = 2;

/**
 * One capture → its separate thoughts (at least one: the text itself).
 * Code cuts the text at natural joins; the model only answers, for each pair of neighbours, "same thing?".
 * Same (or no answer) → they stay one thought. A small model can't rewrite a dump into lines reliably,
 * but it can make this one yes/no call.
 */
export async function splitThoughts(text: string, complete: Complete): Promise<string[]> {
  const lines = splitByLines(text);
  if (isList(lines)) return lines;
  if (lines.length > 1 || words(text).length < MIN_WORDS_TO_SPLIT) return [text];

  const spans = candidateSpans(text);
  if (spans.length < 2 || spans.length > MAX_PARTS) return [text];

  // Merged pieces keep the original text between them ("buy milk and eggs", not "buy milk, eggs").
  const merged: Span[] = [spans[0]];
  for (const span of spans.slice(1)) {
    const previous = merged[merged.length - 1];
    const [a, b] = [tidy(text.slice(previous.start, previous.end)), tidy(text.slice(span.start, span.end))];
    const tooShort = words(a).length < MIN_PIECE_WORDS || words(b).length < MIN_PIECE_WORDS;
    if (tooShort || (await sameThing(a, b, complete))) previous.end = span.end;
    else merged.push({...span});
  }
  return merged.length > 1 ? merged.map(s => tidy(text.slice(s.start, s.end))) : [text];
}

/** "Are these two about the same thing?" — yes/no only. A failed call counts as yes: never split on a guess. */
async function sameThing(a: string, b: string, complete: Complete): Promise<boolean> {
  try {
    const answer = await complete(
      [
        {role: 'system', content: findKnowledge('split').body},
        {role: 'user', content: `A: ${a}\nB: ${b}`},
      ],
      undefined,
      2,
      'root ::= "yes" | "no"',
    );
    return answer.trim().toLowerCase() !== 'no';
  } catch {
    return true;
  }
}
