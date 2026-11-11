import {previewHints} from './hints';

const sat = new Date(2026, 9, 31, 10, 0); // Saturday 10:00

test('hints show where a thought goes and what you said about when — nothing guessed', () => {
  expect(previewHints('gym every monday and thursday at 7am, remind me 10 minutes before', sat)).toEqual([
    '→ Focus',
    'Due Monday at 7:00 AM',
    'Every Mon, Thu',
    'Remind 10 min before',
  ]);
  expect(previewHints('I had a lot of fun today at the diwali party', sat)).toEqual(['→ Your day']);
  expect(previewHints('what if the fridge could order milk', sat)).toEqual(['→ Thought · comes back']);
  expect(previewHints('withdraw cash', sat)).toEqual([]); // not clear from the words: the model decides
});
