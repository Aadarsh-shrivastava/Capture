import type {Complete} from './agent';
import {findKnowledge} from './knowledge';

const MAX_PARTS = 8;
const words = (s: string) => s.toLowerCase().match(/[a-z0-9']+/g) ?? [];

/** Without a model: only explicit separators split — one thought per line (bullets/numbers stripped). */
export function splitByLines(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
}

/** A short list reads as separate thoughts; long lines or many of them are one pasted note. */
const isList = (lines: string[]) => lines.length > 1 && lines.length <= MAX_PARTS && lines.every(l => l.length <= 140);

/**
 * Model lines → parts, only if they're faithful: each line's words come from the text (the small
 * model may paraphrase or invent) and together they cover most of it (nothing dropped). Else null.
 */
export function parseSplit(answer: string, text: string): string[] | null {
  const source = new Set(words(text));
  const lines = splitByLines(answer.replace(/^→\s*/gm, ''));
  if (!isList(lines)) return null;
  const faithful = lines.every(l => {
    const w = words(l);
    return w.length > 0 && w.filter(x => source.has(x)).length / w.length >= 0.8;
  });
  const covered = new Set(lines.flatMap(words));
  const coverage = [...source].filter(x => covered.has(x)).length / source.size;
  return faithful && coverage >= 0.7 ? lines : null;
}

/** Worth asking the model: several sentences or a "btw/also" turn. One short sentence never splits. */
const mightBeSeveral = (text: string) =>
  words(text).length >= 8 && (/[.!?;]\s+\S/.test(text) || /\b(btw|by the way|also|another thing|oh and|and then)\b/i.test(text));

/** One capture → its separate thoughts (at least one: the text itself). */
export async function splitThoughts(text: string, complete?: Complete): Promise<string[]> {
  const lines = splitByLines(text);
  if (isList(lines)) return lines;
  if (lines.length > 1 || !complete || !mightBeSeveral(text)) return [text];
  try {
    const answer = await complete(
      [
        {role: 'system', content: findKnowledge('split').body},
        {role: 'user', content: text},
      ],
      undefined,
      160,
    );
    return parseSplit(answer, text) ?? [text];
  } catch {
    return [text];
  }
}
