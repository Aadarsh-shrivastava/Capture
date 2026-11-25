/// <reference types="node" />
/**
 * train.csv → train.json, which the app bundles (Metro can't import CSV). Run after editing train.csv:
 * npm run classifier:build
 */
import {writeFileSync} from 'node:fs';

import {readCsv} from './csv.ts';

const rows = readCsv('src/classifier/data/train.csv');
writeFileSync('src/classifier/data/train.json', JSON.stringify(rows, null, 1) + '\n');
console.log(`Wrote ${rows.length} rows to src/classifier/data/train.json`);
