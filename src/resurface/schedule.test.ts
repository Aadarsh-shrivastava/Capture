import {autoWeight, nextState, rank, type Memo} from './schedule';

const DAY = 86400000;
const now = new Date(2026, 10, 2, 12).getTime();
const memo = (over: Partial<Memo>): Memo => ({
  itemId: 1, typeName: 'Idea', title: 'cold showers', content: null, createdAt: new Date(now - 10 * DAY).toISOString(),
  hasLink: false, weight: null, reviewAt: null, intervalDays: null, timesShown: 0, ...over,
});

test('auto weight by kind', () => {
  expect(autoWeight(memo({title: 'how do chinese models run so cheaply?', typeName: 'Note'}))).toBe(3);
  expect(autoWeight(memo({}))).toBe(2);
  expect(autoWeight(memo({typeName: 'Note', hasLink: true}))).toBe(2);
  expect(autoWeight(memo({typeName: 'Note'}))).toBe(1);
  expect(autoWeight(memo({typeName: 'Journal', title: 'why?'}))).toBe(0);
});

test('rank: only due, weighted, one per type, off never shows', () => {
  const picked = rank(
    [
      memo({itemId: 1}),
      memo({itemId: 2, weight: 3}),
      memo({itemId: 3, typeName: 'Note', title: 'later', reviewAt: new Date(now + DAY).toISOString()}),
      memo({itemId: 4, typeName: 'Note', weight: 0}),
      memo({itemId: 5, typeName: 'Note', title: 'wifi'}),
    ],
    now,
  );
  expect(picked.map(m => m.itemId)).toEqual([2, 5]);
});

test('open grows the gap; later waits a day; done turns it off', () => {
  const opened = nextState(memo({weight: 3}), 'open', now);
  expect(opened.interval_days).toBe('1.5');
  expect(new Date(opened.review_at).getTime()).toBe(now + 1.5 * DAY);
  const again = nextState(memo({weight: 3, intervalDays: 1.5}), 'open', now);
  expect(again.interval_days).toBe('2.3');

  const later = nextState(memo({weight: 1}), 'later', now);
  expect(new Date(later.review_at).getTime()).toBe(now + DAY);
  expect(later.interval_days).toBe('7');

  expect(nextState(memo({}), 'done', now).weight).toBe('0');
  expect(nextState(memo({}), 'doIt', now).weight).toBe('0');
});
