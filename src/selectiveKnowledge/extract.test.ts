import {inferDueAtFromText} from '@/capture/captureDateContext';

import {extractRemind, extractRepeat, extractSteps, firstOccurrence, inventedWords, kindFromWords, stripDates} from './extract';

test('repeat only when the user says it repeats', () => {
  expect(extractRepeat('gym every monday and thursday at 7am')).toMatchObject({interval_unit: 'week', days: '[1,4]'});
  expect(extractRepeat('pay the credit card bill monthly')).toMatchObject({interval_unit: 'month', days: '[]'}); // not Monday
  expect(extractRepeat('call grandma on weekends')?.days).toBe('[0,6]');
  expect(extractRepeat('take vitamins every day')?.interval_unit).toBe('day');
  expect(extractRepeat('book flight tickets this weekend')).toBeNull();
  expect(extractRepeat('submit the tax form by monday')).toBeNull();
});

test('reminder only from the words after "remind me"', () => {
  expect(extractRemind('standup at 9:30 tomorrow, remind me 10 minutes before')?.offsets).toBe('[10]');
  expect(extractRemind('flight at 6pm, remind me 2 hours before')?.offsets).toBe('[120]');
  expect(extractRemind('buy milk in 2 hours')).toBeNull();
  expect(extractRemind('finish the slides before wednesday')).toBeNull();
});

test('steps only for a colon list or a "then" chain', () => {
  expect(JSON.parse(extractSteps('plan the party: book the venue, order the cake, send invites')!.steps)).toHaveLength(3);
  expect(JSON.parse(extractSteps('set up the laptop then install vscode then copy my dotfiles')!.steps)).toHaveLength(3);
  expect(extractSteps('standup at 9:30 tomorrow, remind me 10 minutes before')).toBeNull();
  expect(extractSteps('doctor tomorrow at 11am, remind me 1 hour before')).toBeNull();
});

test('dates come out of titles', () => {
  expect(stripDates('Dentist appointment on Friday at 3 pm')).toBe('Dentist appointment');
  expect(stripDates('Finish slides before Wednesday')).toBe('Finish slides');
  expect(stripDates('Next Friday dinner at 8 PM')).toBe('dinner');
  expect(stripDates('Pay rent by nov 12')).toBe('Pay rent');
});

test('a repeat with no date said starts on its next day', () => {
  const sat = new Date(2026, 9, 31, 10);
  expect(firstOccurrence({days: '[1,4]'}, sat)).toBe('2026-11-02');
  expect(firstOccurrence({days: '[]'}, sat)).toBe('2026-10-31');
});

test('invented words: stems and filler are fine, new facts are not', () => {
  expect(inventedWords('Fix the leaky tap', 'fix the leaking tap')).toEqual([]);
  expect(inventedWords('Buy groceries and protein powder', 'buy groceries')).toEqual(['protein', 'powder']);
});

test('a date the user never said is invented; a spelling fix is not', () => {
  expect(inventedWords('I need to go to the gym tomorrow', 'I need to go to gym, been thinking to get abs')).toEqual(['tomorrow']);
  expect(inventedWords('I had a lot of fun today', 'I haad a lot of fun today')).toEqual([]);
});

test('your own words decide the kind when they are clear', () => {
  const now = new Date(2026, 10, 9, 10);
  const kind = (t: string) => kindFromWords(t, now, inferDueAtFromText(t, now));
  expect(kind('I haad a lot of fun today at diwali party')).toBe('day'); // "today" doesn't make it a to-do
  expect(kind('I had to call mom tomorrow')).toBe('todo');
  expect(kind('gym every monday')).toBe('todo');
  expect(kind('what if the fridge could order milk')).toBe('idea');
  expect(kind('Jatins number is 9893731864')).toBe('fact');
  expect(kind('withdraw cash')).toBeNull(); // the model decides
});
