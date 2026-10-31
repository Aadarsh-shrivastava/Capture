import {activityByDay, weekColumns} from './activity';

test('counts captures and completions per local day', () => {
  const map = activityByDay([new Date(2026, 9, 30, 23, 30).toISOString()], [new Date(2026, 9, 30, 9).toISOString(), null]);
  expect(map.get('2026-10-30')).toBe(2);
});

test('week columns end with the current week, Monday first', () => {
  const cols = weekColumns(2, new Date(2026, 9, 31)); // Sat
  expect(cols).toHaveLength(2);
  expect(cols[1][0]).toBe('2026-10-26');
  expect(cols[1][6]).toBe('2026-11-01');
  expect(cols[0][0]).toBe('2026-10-19');
});
