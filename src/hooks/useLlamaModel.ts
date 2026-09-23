import {useCallback, useEffect, useRef, useState} from 'react';
import {Platform} from 'react-native';
import RNFS from 'react-native-fs';
import {initLlama, type LlamaContext} from 'llama.rn';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const BUNDLED_MODEL = require('../../llm-models/qwen-q4_k_m.gguf');
const MODEL_NAME = 'qwen-q4_k_m.gguf';

export const LLM_STOP_WORDS = [
  '</s>',
  '<|end|>',
  '<|eot_id|>',
  '<|end_of_text|>',
  '<|endoftext|>',
  '<|im_end|>',
  '<|im_start|>',
];

function resolveBundledModelUri(): string {
  const resolveAssetSource =
    require('react-native/Libraries/Image/resolveAssetSource') as (
      asset: number,
    ) => {uri?: string};
  const source = resolveAssetSource(BUNDLED_MODEL);
  if (!source?.uri) {
    throw new Error('Could not resolve bundled model asset');
  }
  return source.uri;
}

async function copyBundledModelTo(dest: string, bundledUri: string): Promise<void> {
  if (bundledUri.startsWith('http://') || bundledUri.startsWith('https://')) {
    const result = await RNFS.downloadFile({fromUrl: bundledUri, toFile: dest}).promise;
    if (result.statusCode !== 200) {
      throw new Error(`Model download failed (${result.statusCode})`);
    }
    return;
  }

  const fromPath = bundledUri.replace(/^file:\/\//, '');
  await RNFS.copyFile(fromPath, dest);
}

async function ensureModelOnDisk(): Promise<string> {
  const dest = `${RNFS.DocumentDirectoryPath}/${MODEL_NAME}`;
  if (await RNFS.exists(dest)) {
    return dest;
  }

  const bundledUri = resolveBundledModelUri();
  await copyBundledModelTo(dest, bundledUri);
  return dest;
}

type CompletionMessage = {role: 'system' | 'user' | 'assistant'; content: string};

export function useLlamaModel() {
  const contextRef = useRef<LlamaContext | null>(null);
  const [status, setStatus] = useState('Model not loaded');
  const [loadPct, setLoadPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => {
      contextRef.current?.release().catch(() => {});
    };
  }, []);

  const loadModel = useCallback(async () => {
    try {
      setReady(false);
      setStatus('Unpacking model if needed…');
      const modelPath = await ensureModelOnDisk();

      if (contextRef.current) {
        await contextRef.current.release();
        contextRef.current = null;
      }

      setStatus('Loading model…');
      setLoadPct(0);

      const ctx = await initLlama(
        {
          model: modelPath,
          n_ctx: 2048,
          n_gpu_layers: Platform.OS === 'ios' ? 99 : 0,
          use_mlock: true,
        },
        p => setLoadPct(Math.round(p * 100)),
      );

      contextRef.current = ctx;
      setReady(true);
      setStatus(`Ready · GPU: ${ctx.gpu ? 'yes' : 'no'}`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
      setReady(false);
    }
  }, []);

  const complete = useCallback(
    async (
      messages: CompletionMessage[],
      onToken?: (text: string) => void,
      nPredict = 512,
    ): Promise<string> => {
      if (!contextRef.current) {
        throw new Error('Model not loaded');
      }

      setBusy(true);
      let out = '';

      try {
        const result = await contextRef.current.completion(
          {
            messages,
            n_predict: nPredict,
            stop: LLM_STOP_WORDS,
            jinja: true,
            enable_thinking: false,
          },
          t => {
            if (t.content) {
              out = t.content;
            } else if (t.accumulated_text) {
              out = t.accumulated_text;
            } else if (t.token) {
              out += t.token;
            }
            if (out && onToken) {
              onToken(out);
            }
          },
        );

        const reply =
          result.content?.trim() ||
          result.text?.trim() ||
          out.trim() ||
          '';

        if (!reply && result.tokens_predicted === 0) {
          throw new Error(
            `No tokens generated (stopped: ${result.stopping_word || 'unknown'})`,
          );
        }

        return reply;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return {status, loadPct, ready, busy, loadModel, complete};
}
