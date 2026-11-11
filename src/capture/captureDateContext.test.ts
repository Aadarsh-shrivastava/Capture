import {inferDueAtFromText} from './captureDateContext';
import {stripDates} from '@/selectiveKnowledge/extract';

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

test('misspelled tomorrow and day after tomorrow', () => {
  expect(inferDueAtFromText('call the bank tommorow', lateEvening)).toBe('2026-10-31');
  expect(inferDueAtFromText('pay rent tmrw', lateEvening)).toBe('2026-10-31');
  expect(inferDueAtFromText('dentist day after tomorrow', lateEvening)).toBe('2026-11-01');
  expect(stripDates('dentist the day after tomorrow')).toBe('dentist');
  expect(stripDates('call bank tommorow')).toBe('call bank');
});
