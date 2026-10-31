import moment from 'moment';

/** Activity per local day: one point per capture and per completed task. */
export function activityByDay(createdAts: string[], completedAts: (string | null)[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const at of [...createdAts, ...completedAts]) {
    if (!at) continue;
    const key = moment(at).format('YYYY-MM-DD'); // local day, not the UTC slice
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

/** Week columns (Mon–Sun) ending with the current week. */
export function weekColumns(weeks: number, today = new Date()): string[][] {
  const start = moment(today).startOf('isoWeek').subtract(weeks - 1, 'weeks');
  return Array.from({length: weeks}, (_, w) =>
    Array.from({length: 7}, (_, d) => start.clone().add(w * 7 + d, 'days').format('YYYY-MM-DD')),
  );
}
