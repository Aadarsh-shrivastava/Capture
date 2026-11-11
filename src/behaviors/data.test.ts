import {behaviorData, encode, hasBehavior, leadLabel, parseNumbers, parseSteps, withBehavior} from './data';

test('json list fields survive bad input', () => {
  expect(parseSteps(encode([{text: 'a', done: false}, {text: ' ', done: true}]))).toEqual([{text: 'a', done: false}]);
  expect(parseNumbers('[30,"5",null]')).toEqual([30, 5]);
  expect(parseNumbers('oops')).toEqual([]);
});

test('attach and detach any behavior on a draft', () => {
  const draft = {optionalBehaviorNames: ['Visitable'], behaviorData: {Visitable: {url: 'x'}}};
  const on = withBehavior(draft, 'Divisible', {steps: '[]'});
  expect(hasBehavior(on, 'Divisible')).toBe(true);
  expect(behaviorData(on, 'Visitable')).toEqual({url: 'x'});
  const off = withBehavior(on, 'Divisible', null);
  expect(hasBehavior(off, 'Divisible')).toBe(false);
  expect(off.behaviorData).toEqual({Visitable: {url: 'x'}});
});

test('lead labels', () => {
  expect([0, 5, 60, 120, 1440].map(leadLabel)).toEqual(['now', '5 min', '1 hour', '2 hours', '1 day']);
});
