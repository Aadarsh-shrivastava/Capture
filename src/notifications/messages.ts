import moment from 'moment';

const MESSAGES = [
  'Still planning to {title}? {minutes} minutes to go.',
  '{title} in {minutes}. You got this.',
  'Heads up: {title} is coming up in {minutes} minutes.',
  'Future you will thank you for {title}. {minutes} min left.',
  'Psst. {title}. {minutes} minutes. No pressure (some pressure).',
];

/** Stable pick per task + lead time so a resync doesn't change the wording. */
export function reminderMessage(taskId: number, title: string, minutes: number): string {
  return MESSAGES[(taskId + minutes) % MESSAGES.length]
    .replace('{title}', title)
    .replace('{minutes}', String(minutes));
}

/** "3 tasks today · first at 6:00 PM: Go to gym" */
export function summaryMessage(tasks: {title: string; dueAt: string | null}[]): {title: string; body: string} {
  const first = tasks[0];
  const count = `${tasks.length} task${tasks.length === 1 ? '' : 's'} today`;
  const time = first.dueAt && /T\d{2}:\d{2}/.test(first.dueAt) ? ` at ${moment(first.dueAt).format('h:mm A')}` : '';
  return {title: count, body: `First${time}: ${first.title}`};
}
