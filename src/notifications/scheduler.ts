import * as Notifications from 'expo-notifications';

/** Reminder notifications carry Done / Snooze buttons. */
export const REMINDER_CATEGORY = 'task-reminder';
export const ACTION_DONE = 'done';
export const ACTION_SNOOZE = 'snooze';
export const SNOOZE_MINUTES = 10;

export type PlannedNotification = {
  at: Date;
  title: string;
  body: string;
  /** Present on per-task reminders; enables the action buttons. */
  taskId?: number;
  /** Tapping opens this review. */
  review?: 'weekly';
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ponytail: opensAppToForeground false — buttons work while the app is running or suspended;
// a fully killed app may drop the action. Flip to true if that shows up in practice.
Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY, [
  {identifier: ACTION_DONE, buttonTitle: 'Done', options: {opensAppToForeground: false}},
  {identifier: ACTION_SNOOZE, buttonTitle: `Snooze ${SNOOZE_MINUTES} min`, options: {opensAppToForeground: false}},
]).catch(() => {});

export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

function contentOf(n: Omit<PlannedNotification, 'at'>, planned: boolean): Notifications.NotificationContentInput {
  const data = {planned, ...(n.review ? {review: n.review} : {})};
  return n.taskId == null
    ? {title: n.title, body: n.body, data}
    : {title: n.title, body: n.body, categoryIdentifier: REMINDER_CATEGORY, data: {...data, taskId: n.taskId}};
}

/** Cancel only what the job planned — snoozes survive a resync. */
async function cancelPlanned(): Promise<void> {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    pending
      .filter(n => n.content.data?.planned)
      .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/** Replace the job's pending notifications with this set. The OS delivers them even if the app is closed. */
export async function replaceAll(planned: PlannedNotification[]): Promise<void> {
  await cancelPlanned();
  for (const n of planned) {
    await Notifications.scheduleNotificationAsync({
      content: contentOf(n, true),
      trigger: {type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.at},
    });
  }
}

/** Show a notification immediately (dev testing). */
export async function sendNow(n: Omit<PlannedNotification, 'at'>): Promise<void> {
  await Notifications.scheduleNotificationAsync({content: contentOf(n, false), trigger: null});
}

/** Re-show the same reminder later (not marked planned, so resyncs keep it). */
export async function snooze(content: Notifications.NotificationContent): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      categoryIdentifier: REMINDER_CATEGORY,
      data: {...content.data, planned: false},
    },
    trigger: {type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: SNOOZE_MINUTES * 60},
  });
}

export async function clearAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await setBadge(0);
}

export function setBadge(count: number): Promise<boolean> {
  return Notifications.setBadgeCountAsync(count);
}
