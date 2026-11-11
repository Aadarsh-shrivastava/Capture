import type {Complete} from './agent';
import {candidateParts, splitByLines, splitThoughts} from './split';

/** Fake model: "same thing?" is yes only for the pairs listed. */
const sameFor = (pairs: [string, string][]): Complete => async messages => {
  const [a, b] = messages[1].content.replace(/^A: /, '').split('\nB: ');
  return pairs.some(([x, y]) => a.endsWith(x) && b === y) ? 'yes' : 'no';
};

test('lines and bullets split without a model', () => {
  expect(splitByLines('- buy milk\n2) call mom\n\nnote: wifi is abc')).toEqual(['buy milk', 'call mom', 'note: wifi is abc']);
});

test('cut points are the user\'s own joins; connecting words are dropped', () => {
  expect(candidateParts('buy milk. call mom also book the dentist for tomorrow')).toEqual(['buy milk', 'call mom', 'book the dentist for tomorrow']);
  expect(candidateParts('protein shake after gym. btw what is a vector database')).toEqual(['protein shake after gym', 'what is a vector database']);
});

test('unrelated things split, details of one thing stay together', async () => {
  expect(await splitThoughts('buy milk. call mom also book the dentist for tomorrow', sameFor([]))).toEqual(['buy milk', 'call mom', 'book the dentist for tomorrow']);
  expect(await splitThoughts('I need to go to the gym tomorrow at 6 pm and hit legs', sameFor([['6 pm', 'hit legs']]))).toEqual([
    'I need to go to the gym tomorrow at 6 pm and hit legs',
  ]);
});

test('a one-word piece never stands alone; a failed model call never splits', async () => {
  expect(await splitThoughts('remember to buy milk and eggs', sameFor([]))).toEqual(['remember to buy milk and eggs']);
  const broken: Complete = async () => {
    throw new Error('model crashed');
  };
  expect(await splitThoughts('go to the gym and withdraw cash today', broken)).toEqual(['go to the gym and withdraw cash today']);
});

test('one short thought never calls the model', async () => {
  const model = jest.fn<ReturnType<Complete>, Parameters<Complete>>();
  expect(await splitThoughts('call mom tomorrow', model)).toEqual(['call mom tomorrow']);
  expect(model).not.toHaveBeenCalled();
});

test('a comma or plain "and" never cuts: one sentence stays whole, date and all', async () => {
  const model = jest.fn<ReturnType<Complete>, Parameters<Complete>>();
  expect(await splitThoughts('I need to call mom and tell her about the trip tomorrow', model)).toEqual(['I need to call mom and tell her about the trip tomorrow']);
  expect(await splitThoughts('buy milk, eggs and bread on the way home tonight', model)).toEqual(['buy milk, eggs and bread on the way home tonight']);
  expect(model).not.toHaveBeenCalled();
});
