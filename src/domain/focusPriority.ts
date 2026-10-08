import type {FocusQueue, FocusTask} from '@/models/focusTask';
import {formatDueDateLabel} from '@/ui/formatDateTime';

function parseDueDate(dueAt: string | null): Date | null {
  if (!dueAt?.trim()) return null;
  const parsed = new Date(dueAt.includes('T') ? dueAt : `${dueAt}T23:59:59`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isTaskOverdue(task: FocusTask, now = Date.now()): boolean {
  if (task.doableStatus === 'completed' || task.doableStatus === 'cancelled') {
    return false;
  }
  const due = parseDueDate(task.dueAt);
  return due != null && due.getTime() < now;
}

/** Internal ranking only — never shown in UI. */
export function scoreFocusTask(task: FocusTask, now = Date.now()): number {
  let score = 0;

  if (isTaskOverdue(task, now)) {
    score += 120;
    const due = parseDueDate(task.dueAt);
    if (due) {
      const daysOverdue = (now - due.getTime()) / 86400000;
      score += Math.min(daysOverdue * 4, 40);
    }
  } else {
    const due = parseDueDate(task.dueAt);
    if (due) {
      const hoursUntil = (due.getTime() - now) / 3600000;
      if (hoursUntil >= 0 && hoursUntil <= 24) score += 45;
      else if (hoursUntil >= 0 && hoursUntil <= 72) score += 25;
      else if (hoursUntil >= 0 && hoursUntil <= 168) score += 10;
    }
  }

  if (task.urgency != null) score += task.urgency * 10;
  if (task.importance != null) score += task.importance * 6;

  if (task.doableStatus === 'in_progress') score += 15;

  return score;
}

export function partitionFocusTasks(tasks: FocusTask[], now = Date.now()): FocusQueue {
  const active = tasks.filter(
    (task) =>
      task.status !== 'deferred' &&
      task.doableStatus !== 'completed' &&
      task.doableStatus !== 'cancelled',
  );

  const later = tasks.filter(
    (task) =>
      task.status === 'deferred' &&
      task.doableStatus !== 'completed' &&
      task.doableStatus !== 'cancelled',
  );

  const overdue = active
    .filter((task) => isTaskOverdue(task, now))
    .sort((a, b) => scoreFocusTask(b, now) - scoreFocusTask(a, now));

  const overdueIds = new Set(overdue.map((task) => task.id));

  const focusPool = active
    .filter((task) => !overdueIds.has(task.id))
    .sort((a, b) => scoreFocusTask(b, now) - scoreFocusTask(a, now));

  const doNow = focusPool[0] ?? null;
  const next = focusPool.slice(1, 4);

  const laterSorted = [...later].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return {overdue, doNow, next, later: laterSorted};
}

/** Highest-priority active focus task (overdue first, then do-now). */
export function getPrimaryFocusTask(queue: FocusQueue): FocusTask | null {
  return queue.overdue[0] ?? queue.doNow;
}

export function formatDueLabel(dueAt: string | null): string | null {
  return formatDueDateLabel(dueAt);
}
