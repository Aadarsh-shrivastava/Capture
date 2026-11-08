import {canShow, DAILY_LIMIT, hide, markSeen, type Budget} from './budget';

const morning = new Date(2026, 10, 9, 9).getTime();
const empty: Budget = {hiddenUntil: 0, day: '', seen: []};

test('at most a few different come-backs a day; one already shown keeps showing', () => {
  let b = empty;
  for (let id = 1; id <= DAILY_LIMIT; id++) {
    expect(canShow(b, id, morning)).toBe(true);
    b = markSeen(b, id, morning);
  }
  expect(canShow(b, 99, morning)).toBe(false);
  expect(canShow(b, 1, morning)).toBe(true);
  expect(canShow(b, 99, morning + 24 * 3600000)).toBe(true); // next day, fresh
});

test('hiding keeps every come-back away for a few hours', () => {
  const b = hide(empty, morning);
  expect(canShow(b, 1, morning + 3600000)).toBe(false);
  expect(canShow(b, 1, morning + 5 * 3600000)).toBe(true);
});
