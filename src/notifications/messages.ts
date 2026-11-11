import moment from 'moment';

import {leadLabel} from '@/behaviors';

const MESSAGES = [
  'Still planning to {title}? {when} to go.',
  '{title} in {when}. You got this.',
  'Heads up: {title} is coming up in {when}.',
  'Future you will thank you for {title}. {when} left.',
  'Psst. {title}. {when}. No pressure (some pressure).',
];

/** Stable pick per task + lead time so a resync doesn't change the wording. */
export function reminderMessage(taskId: number, title: string, minutes: number): string {
  if (minutes <= 0) return `It's time: ${title}`;
  return MESSAGES[(taskId + minutes) % MESSAGES.length].replace('{title}', title).replace('{when}', leadLabel(minutes));
}

/** "3 tasks today · first at 6:00 PM: Go to gym" */
export function summaryMessage(tasks: {title: string; dueAt: string | null}[]): {title: string; body: string} {
  const first = tasks[0];
  const count = `${tasks.length} task${tasks.length === 1 ? '' : 's'} today`;
  const time = first.dueAt && /T\d{2}:\d{2}/.test(first.dueAt) ? ` at ${moment(first.dueAt).format('h:mm A')}` : '';
  return {title: count, body: `First${time}: ${first.title}`};
}
