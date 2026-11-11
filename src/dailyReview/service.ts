import moment from 'moment';
import Storage from 'expo-sqlite/kv-store';

import type {FocusTask} from '@/models/focusTask';
import {focusRepository} from '@/repositories/focusRepository';
import {rescheduleTask} from '@/taskActions';

import {dayKey, leftoverTasks, moveToDay} from './utils';

const SHOWN_KEY = 'dailyReview.lastShown';

export const dailyReviewService = {
  async loadLeftovers(): Promise<FocusTask[]> {
    return leftoverTasks(await focusRepository.findActiveTasks(), new Date());
  },

  alreadyShownToday: () => Storage.getItemSync(SHOWN_KEY) === dayKey(new Date()),
  markShown: () => Storage.setItemSync(SHOWN_KEY, dayKey(new Date())),

  moveTo: (task: FocusTask, daysFromToday: number) =>
    rescheduleTask(task.id, moveToDay(task.dueAt, moment().add(daysFromToday, 'day').toDate())),

  async moveAllToToday(tasks: FocusTask[]): Promise<void> {
    for (const task of tasks) await dailyReviewService.moveTo(task, 0);
  },
};
