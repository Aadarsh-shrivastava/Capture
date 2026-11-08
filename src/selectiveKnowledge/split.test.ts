import type {Complete} from './agent';
import {parseSplit, splitByLines, splitThoughts} from './split';

const dump =
  'I need to drink protein shake before gym. btw what is the meaning of xyz. how do chinese models run so cheaply. I need to apply at jobs, running out of time';

test('lines and bullets split without a model', () => {
  expect(splitByLines('- buy milk\n2) call mom\n\nnote: wifi is abc')).toEqual(['buy milk', 'call mom', 'note: wifi is abc']);
});

test('faithful model split is used', async () => {
  const model: Complete = async () =>
    'I need to drink protein shake before gym\nwhat is the meaning of xyz\nhow do chinese models run so cheaply\nI need to apply at jobs, running out of time';
  expect(await splitThoughts(dump, model)).toHaveLength(4);
});

test('paraphrased or lossy splits are rejected', () => {
  expect(parseSplit('Drink a whey shake\nLook up a definition', dump)).toBeNull(); // invented words
  expect(parseSplit('protein shake before gym\nwhat is xyz', dump)).toBeNull(); // drops most of it
  expect(parseSplit('one line only', dump)).toBeNull();
});

test('one short thought never calls the model', async () => {
  const model = jest.fn<ReturnType<Complete>, Parameters<Complete>>();
  expect(await splitThoughts('call mom tomorrow', model)).toEqual(['call mom tomorrow']);
  expect(model).not.toHaveBeenCalled();
});

test('a long pasted note stays one item', async () => {
  const note = `${'a long paragraph about something '.repeat(6)}\n${'and another long paragraph '.repeat(6)}`;
  const model = jest.fn(async () => 'NONE');
  expect(await splitThoughts(note, model)).toEqual([note]);
  expect(model).not.toHaveBeenCalled();
});
