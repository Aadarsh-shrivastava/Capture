import rows from './data/train.json';
import {classify, train, type Model, type Result} from './tfidf';

let model: Model | null = null;

/** Built on first use from the bundled examples (milliseconds), then kept in memory. */
export function classifyText(text: string): Result {
  model ??= train(rows);
  return classify(model, text);
}
