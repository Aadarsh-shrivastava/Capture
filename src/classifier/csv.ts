import {readFileSync} from 'node:fs';

import type {Row} from './tfidf.ts';

/** CSV with a `text,label` header. Quote a field that contains commas: "buy milk, eggs",Task */
export function readCsv(path: string): Row[] {
  const lines = readFileSync(path, 'utf8').split(/\r?\n/).slice(1);
  return lines
    .filter(l => l.trim())
    .map(line => {
      const m = line.match(/^\s*(?:"((?:[^"]|"")*)"|([^,]*)),\s*(.+?)\s*$/);
      if (!m) throw new Error(`Bad CSV line: ${line}`);
      return {text: (m[1] ?? m[2]).replace(/""/g, '"'), label: m[3]};
    });
}
