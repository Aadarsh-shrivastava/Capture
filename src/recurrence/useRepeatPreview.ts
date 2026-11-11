import moment from 'moment';
import {useEffect, useMemo, useState} from 'react';

import {parseNumbers} from '@/behaviors/data';
import type {FocusTask} from '@/models/focusTask';
import {behaviorDataRepository} from '@/repositories/behaviorDataRepository';
import {useDataVersionStore} from '@/store/dataVersionStore';
import {hasTimeComponent} from '@/ui/formatDateTime';

import {isRepeatUnit, upcomingOccurrences} from './utils';

/** Future days → display-only copies of repeating tasks landing on them (up to `until`). */
export function useRepeatPreview(tasks: FocusTask[], until: Date): Map<string, FocusTask[]> {
  const version = useDataVersionStore(state => state.version);
  const [rules, setRules] = useState<Map<number, Record<string, string>>>(new Map());

  useEffect(() => {
    behaviorDataRepository.allForBehavior('Repeatable').then(setRules).catch(() => {});
  }, [version]);

  const untilKey = moment(until).format('YYYY-MM-DD');
  return useMemo(() => {
    const byDay = new Map<string, FocusTask[]>();
    for (const task of tasks) {
      const rule = rules.get(task.id);
      if (!rule || !task.dueAt || !isRepeatUnit(rule.interval_unit)) continue;
      const days = upcomingOccurrences(task.dueAt, rule.interval_value, rule.interval_unit, parseNumbers(rule.days), moment(untilKey).toDate());
      for (const day of days) {
        const due = moment(task.dueAt);
        const dueAt = hasTimeComponent(task.dueAt) ? moment(day).hour(due.hour()).minute(due.minute()).format() : day;
        byDay.set(day, [...(byDay.get(day) ?? []), {...task, dueAt}]);
      }
    }
    return byDay;
  }, [tasks, rules, untilKey]);
}
