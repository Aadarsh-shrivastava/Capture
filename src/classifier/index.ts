import {getDatabase} from '@/db/database';
import {CAPTURE_TYPE_NAMES} from '@/capture/captureItemDraft';

import rows from './data/train.json';
import {classify, train, type Model, type Result, type Row} from './tfidf';

let model: Model | null = null;

const key = (text: string) => text.trim().toLowerCase();

/** Bundled examples + the user's corrections; a correction replaces a bundled row with the same words. */
async function build(): Promise<Model> {
  const db = await getDatabase();
  const mine = await db.getAllAsync<Row>('SELECT text, label FROM training_examples');
  const corrected = new Set(mine.map(r => key(r.text)));
  return train([...rows.filter(r => !corrected.has(key(r.text))), ...mine]);
}

/** Built on first use (milliseconds), kept in memory until the user teaches it something new. */
export async function classifyText(text: string): Promise<Result> {
  model ??= await build();
  return classify(model, text);
}

/** Remember that these words mean this type (the same words again: the newest answer wins). Custom types are ignored. */
export async function learn(text: string, label: string): Promise<void> {
  if (!text.trim() || !(CAPTURE_TYPE_NAMES as readonly string[]).includes(label)) return;
  const db = await getDatabase();
  await db.runAsync('INSERT OR REPLACE INTO training_examples (text, label, created_at) VALUES (?, ?, ?)', text.trim(), label, new Date().toISOString());
  model = null;
}
