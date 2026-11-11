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

test('a completed repeat counts as done on the day it was due, even after rolling forward', () => {
  const gym = {id: 7, title: 'gym', status: 'pending', dueAt: '2026-11-01T18:00:00+05:30', completedAt: null};
  expect(dayProgress([gym, row('pending', '2026-10-31')], day, new Map([[7, ['2026-10-31']]]))).toEqual({done: 1, total: 2});
  expect(dayProgress([gym], day)).toEqual({done: 0, total: 0}); // without history it vanished — the old bug
});
