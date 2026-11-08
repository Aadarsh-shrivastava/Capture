import moment from 'moment';

import {isTaskOverdue} from '@/domain/focusPriority';
import {dueMoment, NOW_WINDOW_MS, splitFocusDay, tasksForDay} from '@/domain/focusSections';
import {useMascotStore} from '@/mascot';
import type {FocusTask} from '@/models/focusTask';
import {setHomeWidgetFocusDisplay, type WidgetEntry} from '@/native/homeWidgetCapture';
import {focusRepository} from '@/repositories/focusRepository';
import {formatDueDateLabel, hasTimeComponent} from '@/ui/formatDateTime';

/** What Focus would show at `at`: Now if there is one, else the next task later that day. */
function entryAt(tasks: FocusTask[], at: moment.Moment): WidgetEntry {
  const {now, next} = splitFocusDay(tasksForDay(tasks, at, at), at.valueOf());
  const task = now ?? next[0];
  if (!task) return {at: at.valueOf(), title: null, subtitle: null};

  const dueLabel = formatDueDateLabel(task.dueAt, at);
  const subtitle = isTaskOverdue(task, at.valueOf()) && dueLabel ? `Overdue · ${dueLabel}` : dueLabel ?? null;
  return {at: at.valueOf(), title: task.title, subtitle};
}

/**
 * The widget's answer for now and for every later moment today it changes on its own (a timed task enters its
 * Now window or goes overdue), plus midnight. The widget steps through these without the app running.
 */
export function widgetTimeline(tasks: FocusTask[], start = moment()): WidgetEntry[] {
  const midnight = start.clone().add(1, 'day').startOf('day');
  const changes = tasks
    .flatMap(task => {
      const due = dueMoment(task);
      // Enters the Now window; goes overdue (strictly after due, so a minute past).
      return due && hasTimeComponent(task.dueAt ?? '') ? [due.clone().subtract(NOW_WINDOW_MS, 'ms'), due.clone().add(1, 'minute')] : [];
    })
    .filter(m => m.isAfter(start) && m.isBefore(midnight))
    .sort((a, b) => a.valueOf() - b.valueOf());
  const entries = [start, ...changes, midnight].map(at => entryAt(tasks, at));
  // Drop entries that show the same thing as the one before.
  return entries.filter((e, i) => i === 0 || e.title !== entries[i - 1].title || e.subtitle !== entries[i - 1].subtitle);
}

export function syncHomeWidgetFocusFromTasks(tasks: FocusTask[]): void {
  setHomeWidgetFocusDisplay(widgetTimeline(tasks), useMascotStore.getState().character).catch(() => {});
}

/** Android and iOS widgets both read this snapshot (no-op where the native module lacks it). */
export async function refreshHomeWidgetFocusSnapshot(): Promise<void> {
  const tasks = await focusRepository.findActiveTasks();
  syncHomeWidgetFocusFromTasks(tasks);
}
