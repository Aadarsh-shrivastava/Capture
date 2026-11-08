import {Platform} from 'react-native';
import {initLlama, type LlamaContext} from 'llama.rn';
import {create} from 'zustand';

import {isModelDownloaded, modelPath} from '@/model';

export const LLM_STOP_WORDS = [
  '</s>',
  '<|end|>',
  '<|eot_id|>',
  '<|end_of_text|>',
  '<|endoftext|>',
  '<|im_end|>',
  '<|im_start|>',
];

/** Free the model's ~400 MB after this long without use; the next capture loads it again. */
const IDLE_RELEASE_MS = 60_000;

type CompletionMessage = {role: 'system' | 'user' | 'assistant'; content: string};

/**
 * One model for the whole app (text and voice capture used to load a copy each).
 * Module state, not React state: every hook instance shares the same context.
 */
let context: LlamaContext | null = null;
let loading: Promise<boolean> | null = null;
let idleTimer: ReturnType<typeof setTimeout> | undefined;

const useLlamaStore = create<{status: string; loadPct: number; ready: boolean; busy: boolean}>(() => ({
  status: 'Model not loaded',
  loadPct: 0,
  ready: false,
  busy: false,
}));
const setState = useLlamaStore.setState;

/** Restart the idle countdown (on load and after every completion). */
function touch() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (useLlamaStore.getState().busy) return touch(); // mid-capture: check again later
    const ctx = context;
    context = null;
    setState({ready: false, status: 'Model released (idle)'});
    ctx?.release().catch(() => {});
  }, IDLE_RELEASE_MS);
}

/** Load once (concurrent callers share the same load). False when the model isn't downloaded or fails. */
export function ensureLoaded(): Promise<boolean> {
  if (context) {
    touch();
    return Promise.resolve(true);
  }
  if (loading) return loading;
  loading = (async () => {
    try {
      if (!(await isModelDownloaded())) {
        setState({status: 'AI model not downloaded yet'});
        return false;
      }
      setState({status: 'Loading model…', loadPct: 0});
      context = await initLlama(
        {model: modelPath(), n_ctx: 2048, n_gpu_layers: Platform.OS === 'ios' ? 99 : 0, use_mlock: true},
        p => setState({loadPct: Math.round(p * 100)}),
      );
      setState({ready: true, status: `Ready · GPU: ${context.gpu ? 'yes' : 'no'}`});
      touch();
      return true;
    } catch (e) {
      setState({ready: false, status: e instanceof Error ? e.message : String(e)});
      return false;
    } finally {
      loading = null;
    }
  })();
  return loading;
}

let lock: Promise<unknown> = Promise.resolve();

/** One completion at a time: the capture queue and a new capture's split share one context. */
/** `grammar` (GBNF) restricts the answer to fixed forms, e.g. one of four type names. */
export function complete(messages: CompletionMessage[], onToken?: (text: string) => void, nPredict = 512, grammar?: string): Promise<string> {
  const run = lock.then(() => runCompletion(messages, onToken, nPredict, grammar));
  lock = run.catch(() => {});
  return run;
}

async function runCompletion(messages: CompletionMessage[], onToken?: (text: string) => void, nPredict = 512, grammar?: string): Promise<string> {
  if (!(await ensureLoaded()) || !context) throw new Error('Model not loaded');
  setState({busy: true});
  let out = '';
  try {
    const result = await context.completion(
      {messages, n_predict: nPredict, stop: LLM_STOP_WORDS, jinja: true, enable_thinking: false, ...(grammar ? {grammar} : {})},
      t => {
        if (t.content) out = t.content;
        else if (t.accumulated_text) out = t.accumulated_text;
        else if (t.token) out += t.token;
        if (out && onToken) onToken(out);
      },
    );
    const reply = result.content?.trim() || result.text?.trim() || out.trim() || '';
    if (!reply && result.tokens_predicted === 0) {
      throw new Error(`No tokens generated (stopped: ${result.stopping_word || 'unknown'})`);
    }
    return reply;
  } finally {
    setState({busy: false});
    touch();
  }
}

const loadModel = async () => {
  await ensureLoaded();
};

/** Shared on-device model. `ensureLoaded` loads on demand, so a capture uses it even after an idle release. */
export function useLlamaModel() {
  const {status, loadPct, ready, busy} = useLlamaStore();
  return {status, loadPct, ready, busy, loadModel, ensureLoaded, complete};
}
