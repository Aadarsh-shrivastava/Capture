import * as Notifications from 'expo-notifications';
import {useRouter} from 'expo-router';
import {useEffect} from 'react';
import {AppState} from 'react-native';

import {parseNumbers} from '@/behaviors';
import {behaviorDataRepository} from '@/repositories/behaviorDataRepository';
import {focusRepository} from '@/repositories/focusRepository';
import {useDataVersionStore} from '@/store/dataVersionStore';

import {handleResponse} from './actions';
import {reminderMessage, summaryMessage} from './messages';
import {nextReviewAt} from '@/weeklyReview';

import {overdueCount, remindersFor, summariesFor, type Reminder} from './rules';
import {clearAll, ensurePermission, replaceAll, sendNow, setBadge, type PlannedNotification} from './scheduler';
import {useReminderSettings} from './settings';

export {useReminderSettings} from './settings';

const JOB_INTERVAL_MS = 10 * 60 * 1000;

function plan(reminders: Reminder[], summaries: ReturnType<typeof summariesFor>): PlannedNotification[] {
  return [
    ...reminders.map(r => ({
      at: r.at,
      taskId: r.task.id,
      title: r.task.title,
      body: reminderMessage(r.task.id, r.task.title, r.minutesBefore),
    })),
    ...summaries.map(s => ({at: s.at, ...summaryMessage(s.tasks)})),
  ];
}

/** The job: read tasks, keep the OS reminder + morning summary schedule in sync. */
export async function syncTaskReminders(enabled: boolean): Promise<Reminder[]> {
  if (!enabled) {
    await clearAll();
    return [];
  }
  if (!(await ensurePermission())) throw new Error('Notification permission denied');
  const [tasks, remindable] = await Promise.all([
    focusRepository.findActiveTasks(),
    behaviorDataRepository.allForBehavior('Remindable'),
  ]);
  const now = new Date();
  const leadsFor = (id: number) => {
    const offsets = parseNumbers(remindable.get(id)?.offsets);
    return offsets.length ? offsets : undefined;
  };
  const reminders = remindersFor(tasks, now, leadsFor);
  await replaceAll([
    ...plan(reminders, summariesFor(tasks, now)),
    {at: nextReviewAt(now), title: 'Your week in review', body: 'Two minutes: what got done, what slipped, what is next.', review: 'weekly'},
  ]);
  await setBadge(overdueCount(tasks, now));
  return reminders;
}

/** Dev: run the job now and immediately show the next reminder so you can see it. */
export async function runReminderJobNow(): Promise<Reminder[]> {
  const reminders = await syncTaskReminders(true);
  const next = reminders[0];
  if (next) {
    await sendNow({
      taskId: next.task.id,
      title: next.task.title,
      body: reminderMessage(next.task.id, next.task.title, next.minutesBefore),
    });
  }
  return reminders;
}

/**
 * Mount once. Runs the job on start, on every item save, when the app returns
 * to the foreground, and every 10 minutes while open. Also handles taps and Done/Snooze buttons.
 * ponytail: no background fetch — notifications are scheduled ahead with the OS, so they fire
 * with the app closed. The 8 AM summary nudges you to open the app, which books that day's reminders.
 */
export function TaskReminders() {
  const enabled = useReminderSettings(state => state.enabled);
  const version = useDataVersionStore(state => state.version);
  const response = Notifications.useLastNotificationResponse();
  const router = useRouter();

  useEffect(() => {
    if (!response) return;
    handleResponse(response)
      .then(taskId => taskId && router.push(`/item/${taskId}`))
      .catch(() => {});
  }, [response, router]);

  useEffect(() => {
    const run = () => syncTaskReminders(enabled).catch(() => {});
    run();
    if (!enabled) return;

    const timer = setInterval(run, JOB_INTERVAL_MS);
    const sub = AppState.addEventListener('change', state => state === 'active' && run());
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [enabled, version]);

  return null;
}
