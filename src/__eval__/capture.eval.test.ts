/**
 * Model eval: the real capture pipeline (split + agent, same prompts and parsing as the app) against the same GGUF,
 * served by llama.cpp on this Mac. Skipped unless MODEL_EVAL_URL is set — run scripts/model-eval.sh.
 * One test per dump; a failure lists every wrong field, what was expected, what came out, and the model's steps.
 */
import {LLM_STOP_WORDS} from '@/hooks/useLlamaModel';
import {runSelectiveAgent, type Complete} from '@/selectiveKnowledge/agent';
import {splitThoughts} from '@/selectiveKnowledge/split';

import {CAPTURE_CASES, EVAL_NOW, SPLIT_CASES} from './captureCases';
import {inventedWords, scoreCase, tally, type FieldResult} from './score';

jest.mock('llama.rn', () => ({initLlama: jest.fn()}));
jest.mock('@/model', () => ({isModelDownloaded: jest.fn(), modelPath: jest.fn()}));

const URL_BASE = process.env.MODEL_EVAL_URL;
const run = URL_BASE ? describe : describe.skip;

/** Same contract as useLlamaModel().complete, against llama-server (greedy, so runs repeat exactly). */
const complete: Complete = async (messages, _onToken, nPredict = 512, grammar) => {
  const res = await fetch(`${URL_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({messages, max_tokens: nPredict, temperature: 0, stop: LLM_STOP_WORDS, ...(grammar ? {grammar} : {})}),
  });
  return (await res.json()).choices[0].message.content ?? '';
};

const all: FieldResult[] = [];
const why = (misses: FieldResult[], journey: string[]) =>
  misses.map(m => `${m.field}: expected ${m.expected}, got ${m.got}`).join('\n') + `\nmodel steps: ${journey.join(' → ')}`;

run('capture model eval', () => {
  afterAll(() => {
    const lines = Object.entries(tally(all)).map(([f, {passed, total}]) => `${f.padEnd(28)} ${passed}/${total}  ${Math.round((passed / total) * 100)}%`);
    console.log(`\nPass rate per field\n${lines.join('\n')}`);
  });

  describe('one thought → one item', () => {
    test.each(CAPTURE_CASES.map(c => [c.text, c] as const))('%s', async (_text, c) => {
      let results: FieldResult[];
      let journey: string[] = [];
      try {
        const out = await runSelectiveAgent(c.text, complete, {now: EVAL_NOW});
        journey = out.journey;
        results = scoreCase(c, out.draft);
      } catch (e) {
        results = [{field: 'item created', ok: false, expected: c.type, got: `error: ${e instanceof Error ? e.message : e}`}];
      }
      all.push(...results);
      const misses = results.filter(r => !r.ok);
      if (misses.length) throw new Error(why(misses, journey));
    });
  });

  describe('one dump → the right number of items, nothing made up', () => {
    test.each(SPLIT_CASES.map(c => [c.text, c] as const))('%s', async (_text, c) => {
      const parts = await splitThoughts(c.text, complete);
      const invented = parts.flatMap(p => inventedWords(p, c.text));
      const results: FieldResult[] = [
        {field: 'items from a dump', ok: parts.length === c.parts, expected: String(c.parts), got: JSON.stringify(parts)},
        {field: 'split invents nothing', ok: invented.length === 0, expected: 'only words from the dump', got: JSON.stringify(invented)},
      ];
      all.push(...results);
      const misses = results.filter(r => !r.ok);
      if (misses.length) throw new Error(why(misses, []));
    });
  });
});
