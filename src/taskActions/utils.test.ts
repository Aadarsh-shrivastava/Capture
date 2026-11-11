import {postponedDue} from './utils';

const now = new Date(2026, 9, 31, 10, 0);
const ms = (s: string) => new Date(s).getTime();

test('later = original time + hours, or from now when that is already past / untimed', () => {
  expect(ms(postponedDue(new Date(2026, 9, 31, 9, 0).toISOString(), 6, now))).toBe(new Date(2026, 9, 31, 15, 0).getTime());
  expect(ms(postponedDue(new Date(2026, 9, 30, 9, 0).toISOString(), 6, now))).toBe(new Date(2026, 9, 31, 16, 0).getTime());
  expect(ms(postponedDue('2026-10-31', 6, now))).toBe(new Date(2026, 9, 31, 16, 0).getTime());
});
