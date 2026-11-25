import assert from 'node:assert/strict';

import {classify, train} from './tfidf';

const model = train([
  {text: 'buy milk', label: 'Task'},
  {text: 'call mom tomorrow', label: 'Task'},
  {text: 'had a great day', label: 'Journal'},
  {text: 'felt tired today', label: 'Journal'},
]);

test('picks the label of the most similar examples', () => {
  assert.equal(classify(model, 'buy bread tomorrow').label, 'Task');
  assert.equal(classify(model, 'had a lovely day').label, 'Journal');
});

test('no shared words → no label, zero confidence', () => {
  assert.deepEqual(classify(model, 'xyz qwerty'), {label: null, confidence: 0, scores: {}});
});

test('one-sided match is fully confident', () => {
  assert.equal(classify(model, 'buy eggs').confidence, 1);
});
