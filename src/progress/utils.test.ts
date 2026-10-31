import {dayProgress} from './utils';

const day = new Date(2026, 9, 31, 10);
const row = (status: string, dueAt: string | null) => ({id: 1, title: 't', status, dueAt, completedAt: null});

test('counts only tasks due that day', () => {
  expect(
    dayProgress(
      [row('completed', '2026-10-31'), row('pending', new Date(2026, 9, 31, 18).toISOString()), row('pending', '2026-11-01'), row('cancelled', '2026-10-31'), row('pending', null)],
      day,
    ),
  ).toEqual({done: 1, total: 2});
});
