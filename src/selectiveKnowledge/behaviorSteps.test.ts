import {parseRemind, parseRepeat, parseSteps, parseWeight} from './behaviorSteps';

test('repeat answers', () => {
  expect(parseRepeat('weekly on mon,wed,fri')).toEqual({interval_value: '1', interval_unit: 'week', days: '[1,3,5]'});
  expect(parseRepeat('daily')?.interval_unit).toBe('day');
  expect(parseRepeat('gym every weekday')?.days).toBe('[1,2,3,4,5]');
  expect(parseRepeat('NONE')).toBeNull();
  expect(parseRepeat('call mom tomorrow')).toBeNull();
});

test('remind answers', () => {
  expect(parseRemind('1 hour before')).toEqual({offsets: '[60]'});
  expect(parseRemind('remind me 15 min earlier and at the time')).toEqual({offsets: '[15,0]'});
  expect(parseRemind('NONE')).toBeNull();
});

test('steps answers', () => {
  expect(JSON.parse(parseSteps('Passport\nCharger\nSunscreen')!.steps).map((s: {text: string}) => s.text)).toEqual(['Passport', 'Charger', 'Sunscreen']);
  expect(JSON.parse(parseSteps('pack for trip: passport, charger, and sunscreen')!.steps)).toHaveLength(3);
  expect(parseSteps('NONE')).toBeNull();
  expect(parseSteps('Call mom')).toBeNull();
});

test('come back weight', () => {
  expect(parseWeight('Often.')).toEqual({weight: '3'});
  expect(parseWeight('never')).toEqual({weight: '0'});
  expect(parseWeight('maybe')).toBeNull();
});
