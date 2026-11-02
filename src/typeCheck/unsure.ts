import {hintFitsText} from '@/selectiveKnowledge/agent';
import {keywordScore} from '@/selectiveKnowledge/typeKeywords';

/** A type that knows this many words has learned enough — it stops asking. */
export const KNOWN_WORDS = 15;
/** Keyword score at which a custom pick counts as confident. */
const SURE_SCORE = 3;

type CustomType = {name: string; description?: string | null; keywords: string[]};

/**
 * Custom types worth asking about for this text, or null when the pick is confident.
 * Asks only when a still-learning type shares words with the text, and the pick isn't a
 * strong keyword match for a custom type.
 */
export function unsureCandidates(text: string, picked: string, customTypes: CustomType[]): string[] | null {
  const pickedType = customTypes.find(t => t.name === picked);
  if (pickedType && keywordScore(pickedType, text) >= SURE_SCORE) return null;
  const others = customTypes.filter(t => t.name !== picked && t.keywords.length < KNOWN_WORDS && hintFitsText(t, text));
  return others.length ? others.map(t => t.name) : null;
}
