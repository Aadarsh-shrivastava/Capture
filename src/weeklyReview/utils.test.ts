import {isReviewTime, nextReviewAt, weekSummary} from './utils';

const now = new Date(2026, 10, 1, 18, 0); // Sun 1 Nov 2026, 18:00
const row = (id: number, status: string, dueAt: string | null, completedAt: string | null = null) =>
  ({id, title: `t${id}`, status, dueAt, completedAt});

test('done this week, slipped, upcoming next week', () => {
  const s = weekSummary(
    [
      row(1, 'completed', '2026-10-28', new Date(2026, 9, 28, 9).toISOString()), // done Wed
      row(2, 'completed', '2026-10-20', new Date(2026, 9, 20, 9).toISOString()), // done last week
      row(3, 'pending', '2026-10-30'), // slipped
      row(4, 'pending', '2026-11-04'), // next week
      row(5, 'pending', '2026-11-01'), // today, not slipped
    ],
    now,
  );
  expect(s.done.map(r => r.id)).toEqual([1]);
  expect(s.slipped.map(r => r.id)).toEqual([3]);
  expect(s.upcoming.map(r => r.id)).toEqual([4]);
});

test('review time and next notification slot', () => {
  expect(isReviewTime(now)).toBe(true);
  expect(isReviewTime(new Date(2026, 10, 1, 9))).toBe(false);
  expect(nextReviewAt(now).getTime()).toBe(new Date(2026, 10, 1, 19).getTime());
  expect(nextReviewAt(new Date(2026, 10, 1, 20)).getTime()).toBe(new Date(2026, 10, 8, 19).getTime());
});
