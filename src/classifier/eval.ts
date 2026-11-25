/// <reference types="node" />
/**
 * Train on data/train.csv, grade on data/test.csv, print accuracy and every miss.
 * Run: npm run classifier:eval
 */
import {readCsv} from './csv.ts';
import {classify, train} from './tfidf.ts';

const trainRows = readCsv('src/classifier/data/train.csv');
const testRows = readCsv('src/classifier/data/test.csv');
const model = train(trainRows);

const perLabel: Record<string, {right: number; total: number}> = {};
const misses: string[] = [];
for (const row of testRows) {
  const r = classify(model, row.text);
  const stat = (perLabel[row.label] ??= {right: 0, total: 0});
  stat.total++;
  if (r.label === row.label) stat.right++;
  else misses.push(`  "${row.text}"\n    expected ${row.label}, got ${r.label ?? 'nothing'} (confidence ${r.confidence.toFixed(2)})`);
}

const right = Object.values(perLabel).reduce((s, x) => s + x.right, 0);
console.log(`Trained on ${trainRows.length} examples, tested on ${testRows.length}\n`);
for (const [label, {right: r, total}] of Object.entries(perLabel)) console.log(`  ${label.padEnd(8)} ${r}/${total}  ${Math.round((100 * r) / total)}%`);
console.log(`\nOverall: ${Math.round((100 * right) / testRows.length)}%`);
if (misses.length) console.log(`\nMisses — add train examples like these:\n${misses.join('\n')}`);
