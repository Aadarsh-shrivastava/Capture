import {Platform} from 'react-native';

import {
  formatDueLabel,
  getPrimaryFocusTask,
  isTaskOverdue,
  partitionFocusTasks,
} from '@/domain/focusPriority';
import type {FocusTask} from '@/models/focusTask';
import {setHomeWidgetFocusDisplay} from '@/native/homeWidgetCapture';
import {focusRepository} from '@/repositories/focusRepository';

function snapshotFromTasks(tasks: FocusTask[]) {
  const queue = partitionFocusTasks(tasks);
  const task = getPrimaryFocusTask(queue);

  if (!task) {
    return {title: null, subtitle: null};
  }

  const overdue = isTaskOverdue(task);
  const dueLabel = formatDueLabel(task.dueAt);
  const subtitle =
    overdue && dueLabel ? `Overdue · ${dueLabel}` : dueLabel ?? null;

  return {title: task.title, subtitle};
}

export function syncHomeWidgetFocusFromTasks(tasks: FocusTask[]): void {
  if (Platform.OS !== 'android') {
    return;
  }

  const {title, subtitle} = snapshotFromTasks(tasks);
  setHomeWidgetFocusDisplay(title, subtitle).catch(() => {});
}

export async function refreshHomeWidgetFocusSnapshot(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  const tasks = await focusRepository.findActiveTasks();
  syncHomeWidgetFocusFromTasks(tasks);
}
