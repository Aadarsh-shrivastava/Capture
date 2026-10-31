import moment from 'moment';

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

/** Next due after `now`, stepping from the current due by the interval. Keeps date-only vs timed format. */
export function nextDueAt(dueAt: string, intervalValue: string | number, unit: RepeatUnit, now = new Date()): string | null {
  const due = moment(dueAt);
  const step = Math.max(1, Number(intervalValue) || 1);
  if (!due.isValid()) return null;
  const timed = hasTimeComponent(dueAt);
  do {
    due.add(step, unit);
  } while (timed ? due.isSameOrBefore(now) : due.isBefore(now, 'day'));
  return timed ? due.format() : due.format('YYYY-MM-DD');
}

export function repeatUnitOf(draft: Pick<CaptureItemDraft, 'optionalBehaviorNames' | 'behaviorData'>): RepeatUnit | null {
  if (!draft.optionalBehaviorNames?.includes('Repeatable')) return null;
  const unit = draft.behaviorData?.Repeatable?.interval_unit;
  return isRepeatUnit(unit) ? unit : null;
}

export function repeatLabel(unit: RepeatUnit | null): string {
  return unit ? REPEAT_LABEL[unit] : 'Never';
}

/** Draft with Repeatable turned on (every 1 unit) or off. */
export function withRepeat(draft: CaptureItemDraft, unit: RepeatUnit | null): CaptureItemDraft {
  const names = (draft.optionalBehaviorNames ?? []).filter(name => name !== 'Repeatable');
  const {Repeatable: _old, ...rest} = draft.behaviorData ?? {};
  if (!unit) return {...draft, optionalBehaviorNames: names, behaviorData: rest};
  return {
    ...draft,
    optionalBehaviorNames: [...names, 'Repeatable'],
    behaviorData: {...rest, Repeatable: {...(_old ?? {}), interval_value: '1', interval_unit: unit}},
  };
}
