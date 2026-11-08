import type {Complete} from './agent';
import {findKnowledge} from './knowledge';
import {STOPWORDS} from './stopwords';


/** Answer → clean single words (lowercase, unique, ≤ 25). */
export function parseKeywords(answer: string): string[] {
  const words = answer
    .toLowerCase()
    .split(/[,\n;]+/)
    .map(w => w.replace(/[^a-z0-9 -]/g, '').trim())
    .filter(w => w.length >= 2 && w.length <= 20 && !w.includes(' ') && !STOPWORDS.has(w));
  return [...new Set(words)].slice(0, 25);
}

/** Words in a capture that say something about its kind (for learning from corrections). */
export function distinctiveWords(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z][a-z0-9]{2,}/g) ?? [];
  return [...new Set(words.filter(w => !STOPWORDS.has(w) && !/^www|^https?$|com$/.test(w)))].slice(0, 12);
}

/** One model call: expand a type's name + description into related words. Empty on failure. */
export async function generateTypeKeywords(type: {name: string; description?: string | null}, complete: Complete): Promise<string[]> {
  const knowledge = findKnowledge('typeKeywords');
  try {
    const raw = await complete(
      [
        {role: 'system', content: knowledge.body},
        {role: 'user', content: `${type.name}${type.description ? `: ${type.description}` : ''}`},
      ],
      undefined,
      80,
    );
    // The type's own words always count.
    return parseKeywords(`${type.name}, ${(type.description ?? '').replace(/\s+/g, ',')}, ${raw}`);
  } catch {
    return [];
  }
}

type Scorable = {name: string; description?: string | null; keywords?: string[]};

const tokens = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];
const sameWord = (a: string, b: string) => a === b || (a.length >= 4 && b.length >= 4 && a.slice(0, 4) === b.slice(0, 4));

/** Distinct hint words found in the text; the type's own name counts double. */
export function keywordScore(type: Scorable, text: string): number {
  const words = tokens(text);
  const hit = (w: string) => words.some(t => sameWord(t, w));
  const hints = new Set(
    [...tokens(type.description ?? ''), ...(type.keywords ?? []).flatMap(tokens)].filter(w => w.length >= 2 && !STOPWORDS.has(w)),
  );
  const nameHits = tokens(type.name).filter(w => !STOPWORDS.has(w) && hit(w)).length;
  return nameHits * 2 + [...hints].filter(hit).length;
}
