import {inferDueAtFromText} from './captureDateContext';

// Late evening IST: UTC is still the same day, but local "today"/"tomorrow" must be used.
const lateEvening = new Date(2026, 9, 30, 23, 31);
// Just after midnight IST: UTC is still the previous day.
const afterMidnight = new Date(2026, 9, 31, 0, 30);

test('relative dates resolve in local time', () => {
  expect(inferDueAtFromText('buy milk today', lateEvening)).toBe('2026-10-30');
  expect(inferDueAtFromText('buy milk today', afterMidnight)).toBe('2026-10-31');
  const due = inferDueAtFromText('gym tomorrow at 6 pm', afterMidnight);
  expect(new Date(due).getTime()).toBe(new Date(2026, 10, 1, 18, 0).getTime());
  expect(due).not.toMatch(/Z$/);
});
