import {inferRepeatUnit, nextDueAt, repeatUnitOf, withRepeat} from './utils';

const now = new Date(2026, 9, 31, 10, 0); // Sat 31 Oct 2026, 10:00 local

test('rolls timed and date-only dues past now, keeping the format', () => {
  const local = (d: number, h: number) => new Date(2026, 9, d, h).toISOString();
  const ms = (s: string | null) => new Date(s ?? '').getTime();
  expect(ms(nextDueAt(local(31, 9), '1', 'day', now))).toBe(new Date(2026, 10, 1, 9).getTime()); // 9:00 already passed
  expect(ms(nextDueAt(local(31, 18), '1', 'day', now))).toBe(new Date(2026, 10, 1, 18).getTime());
  expect(nextDueAt('2026-10-20', '1', 'week', now)).toBe('2026-11-03');
  expect(nextDueAt('2026-10-31', 1, 'month', now)).toBe('2026-11-30');
});

test('infers unit from text and toggles on a draft', () => {
  expect(inferRepeatUnit('gym every day at 6')).toBe('day');
  expect(inferRepeatUnit('pay rent monthly')).toBe('month');
  expect(inferRepeatUnit('call mom every sunday')).toBe('week');

  const base = {typeName: 'Task' as const, title: 'Gym', optionalBehaviorNames: [], behaviorData: {}};
  const on = withRepeat(base, 'day');
  expect(repeatUnitOf(on)).toBe('day');
  expect(repeatUnitOf(withRepeat(on, null))).toBeNull();
});
