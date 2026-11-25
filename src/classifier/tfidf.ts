/**
 * TF-IDF + k-nearest-neighbours text classifier. No dependencies, runs in Node and React Native.
 *
 * "Training" = remember the labelled examples and count how rare each word is.
 * Classifying = find the k stored examples whose words overlap most with the input, let them vote.
 */

export type Row = {text: string; label: string};
type Vec = Map<string, number>;

export type Model = {
  idf: Map<string, number>;
  examples: {label: string; vec: Vec}[];
};

export type Result = {
  label: string | null; // null = shares no words with any example
  confidence: number; // 0..1: gap between best and second-best label, relative to best
  scores: Record<string, number>;
};

/** Words + word pairs. Stopwords are KEPT: "need to", "had a", "what if" are the signal. */
export function tokenize(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
  const pairs = words.slice(1).map((w, i) => `${words[i]} ${w}`);
  return [...words, ...pairs];
}

function vectorize(tokens: string[], idf: Map<string, number>): Vec {
  const vec: Vec = new Map();
  for (const t of tokens) {
    const w = idf.get(t);
    if (w !== undefined) vec.set(t, (vec.get(t) ?? 0) + w); // tf × idf, summed per occurrence
  }
  const norm = Math.sqrt([...vec.values()].reduce((s, v) => s + v * v, 0));
  for (const [t, v] of vec) vec.set(t, v / norm);
  return vec;
}

function cosine(a: Vec, b: Vec): number {
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [t, v] of small) dot += v * (big.get(t) ?? 0);
  return dot; // both vectors have length 1, so the dot product IS the cosine
}

/** Cheap (milliseconds for thousands of rows): retrain from scratch whenever examples change. */
export function train(rows: Row[]): Model {
  const docs = rows.map(r => tokenize(r.text));
  const df = new Map<string, number>(); // how many sentences contain each token
  for (const doc of docs) for (const t of new Set(doc)) df.set(t, (df.get(t) ?? 0) + 1);

  const n = docs.length;
  const idf = new Map<string, number>();
  // Smoothed like scikit-learn: rare token → big weight, token in every sentence → ~1.
  for (const [t, count] of df) idf.set(t, Math.log((1 + n) / (1 + count)) + 1);

  return {idf, examples: docs.map((doc, i) => ({label: rows[i].label, vec: vectorize(doc, idf)}))};
}

export function classify(model: Model, text: string, k = 5): Result {
  const vec = vectorize(tokenize(text), model.idf);
  const nearest = model.examples
    .map(e => ({label: e.label, sim: cosine(vec, e.vec)}))
    .filter(e => e.sim > 0)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, k);

  const scores: Record<string, number> = {};
  for (const e of nearest) scores[e.label] = (scores[e.label] ?? 0) + e.sim;

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return {label: null, confidence: 0, scores};
  const [best, second = 0] = ranked.map(([, s]) => s);
  return {label: ranked[0][0], confidence: (best - second) / best, scores};
}
