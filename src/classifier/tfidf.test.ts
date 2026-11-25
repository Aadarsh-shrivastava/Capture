import {classify, train} from './tfidf';

const model = train([
  {text: 'buy milk', label: 'Task'},
  {text: 'call mom tomorrow', label: 'Task'},
  {text: 'had a great day', label: 'Journal'},
  {text: 'felt tired today', label: 'Journal'},
]);

test('picks the label of the most similar examples', () => {
  expect(classify(model, 'buy bread tomorrow').label).toBe('Task');
  expect(classify(model, 'had a lovely day').label).toBe('Journal');
});

test('no shared words → no label, zero confidence', () => {
  expect(classify(model, 'xyz qwerty')).toEqual({label: null, confidence: 0, scores: {}});
});

test('one-sided match is fully confident', () => {
  expect(classify(model, 'buy eggs').confidence).toBe(1);
});

test('the bundled train.json matches train.csv (run `npm run classifier:build` after editing the CSV)', () => {
  const {readCsv} = require('./csv');
  expect(require('./data/train.json')).toEqual(readCsv('src/classifier/data/train.csv'));
});
