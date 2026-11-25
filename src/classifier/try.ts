/**
 * Classify one sentence and show why. Run: npm run classifier:try -- "buy milk tomorrow"
 */
import {readCsv} from './csv.ts';
import {classify, train} from './tfidf.ts';

const text = process.argv.slice(2).join(' ');
if (!text) throw new Error('Usage: npm run classifier:try -- "your sentence"');

const r = classify(train(readCsv('src/classifier/data/train.csv')), text);
console.log(`${r.label ?? 'no match'}  (confidence ${r.confidence.toFixed(2)})`);
console.log('scores:', r.scores);
