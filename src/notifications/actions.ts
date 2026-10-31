import type * as Notifications from 'expo-notifications';
import Storage from 'expo-sqlite/kv-store';

import {completeTask} from '@/taskActions';
import {openWeeklyReview} from '@/weeklyReview';

import {ACTION_DONE, ACTION_SNOOZE, snooze} from './scheduler';

const HANDLED_KEY = 'notifications.lastHandledResponse';

/** What a notification tap / button press should do. Returns a task id to open, if any. */
export async function handleResponse(response: Notifications.NotificationResponse): Promise<number | null> {
  const {notification, actionIdentifier} = response;
  // The same response can be replayed on relaunch; handle each once.
  const key = `${notification.request.identifier}:${actionIdentifier}:${notification.date}`;
  if (Storage.getItemSync(HANDLED_KEY) === key) return null;
  Storage.setItemSync(HANDLED_KEY, key);

  if (notification.request.content.data?.review === 'weekly') {
    openWeeklyReview();
    return null;
  }

  const taskId = Number(notification.request.content.data?.taskId);
  const hasTask = Number.isFinite(taskId) && taskId > 0;

  if (actionIdentifier === ACTION_DONE && hasTask) {
    await completeTask(taskId, notification.request.content.title ?? 'Task', {undo: false});
    return null;
  }
  if (actionIdentifier === ACTION_SNOOZE) {
    await snooze(notification.request.content);
    return null;
  }
  return hasTask ? taskId : null;
}
