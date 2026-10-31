import moment from 'moment';

import {encode, parseNumbers, withBehavior} from '@/behaviors/data';
import type {CaptureItemDraft} from '@/capture/captureItemDraft';
import {hasTimeComponent} from '@/ui/formatDateTime';

export type RepeatUnit = 'day' | 'week' | 'month';

export const REPEAT_OPTIONS: {label: string; value: RepeatUnit | null}[] = [
  {label: 'Never', value: null},
  {label: 'Daily', value: 'day'},
  {label: 'Weekly', value: 'week'},
  {label: 'Monthly', value: 'month'},
];

const REPEAT_LABEL: Record<RepeatUnit, string> = {day: 'Daily', week: 'Weekly', month: 'Monthly'};

export function isRepeatUnit(value: unknown): value is RepeatUnit {
  return value === 'day' || value === 'week' || value === 'month';
}

/** "daily", "every day" → day; "weekly", "every monday" → week; "monthly" → month. */
export function inferRepeatUnit(text: string): RepeatUnit {
  const lower = text.toLowerCase();
  if (/\b(daily|every\s*day|each\s*day|every\s*morning|every\s*night|every\s*evening)\b/.test(lower)) return 'day';
  if (/\b(monthly|every\s*month)\b/.test(lower)) return 'month';
  return 'week';
}

export const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Next due after `now`, stepping from the current due. Keeps date-only vs timed format.
 * Weekly with `days` (0=Sun…6=Sat) means "on these weekdays": walk day by day to the next match.
 */
export function nextDueAt(
  dueAt: string,
  intervalValue: string | number,
  unit: RepeatUnit,
  now = new Date(),
  days: number[] = [],
): string | null {
  const due = moment(dueAt);
  if (!due.isValid()) return null;
  const timed = hasTimeComponent(dueAt);
  const byWeekday = unit === 'week' && days.length > 0;
  const step = Math.max(1, Number(intervalValue) || 1);
  const pending = () => (timed ? due.isSameOrBefore(now) : due.isBefore(now, 'day'));
  do {
    if (byWeekday) due.add(1, 'day');
    else due.add(step, unit);
  } while (pending() || (byWeekday && !days.includes(due.day())));
  return timed ? due.format() : due.format('YYYY-MM-DD');
}

type Draftish = Pick<CaptureItemDraft, 'optionalBehaviorNames' | 'behaviorData'>;

export function repeatDaysOf(draft: Draftish): number[] {
  return parseNumbers(draft.behaviorData?.Repeatable?.days);
}

export function repeatUnitOf(draft: Draftish): RepeatUnit | null {
  if (!draft.optionalBehaviorNames?.includes('Repeatable')) return null;
  const unit = draft.behaviorData?.Repeatable?.interval_unit;
  return isRepeatUnit(unit) ? unit : null;
}

export function repeatLabel(unit: RepeatUnit | null): string {
  return unit ? REPEAT_LABEL[unit] : 'Never';
}

/** Draft with Repeatable turned on (every 1 unit, optional weekdays for weekly) or off. */
export function withRepeat(draft: CaptureItemDraft, unit: RepeatUnit | null, days: number[] = []): CaptureItemDraft {
  if (!unit) return withBehavior(draft, 'Repeatable', null);
  return withBehavior(draft, 'Repeatable', {
    interval_value: '1',
    interval_unit: unit,
    days: unit === 'week' ? encode([...days].sort()) : '[]',
  });
}

/**
 * Future dates (YYYY-MM-DD) a repeating item will land on after its current due, up to `until`.
 * Display only — nothing is stored; the real item still moves forward when completed.
 */
export function upcomingOccurrences(
  dueAt: string,
  intervalValue: string | number,
  unit: RepeatUnit,
  days: number[],
  until: Date,
): string[] {
  const out: string[] = [];
  let cursor: string | null = dueAt;
  for (let i = 0; i < 400 && cursor; i += 1) {
    cursor = nextDueAt(cursor, intervalValue, unit, moment(cursor).toDate(), days);
    if (!cursor || moment(cursor).isAfter(until, 'day')) break;
    out.push(moment(cursor).format('YYYY-MM-DD'));
  }
  return out;
}
