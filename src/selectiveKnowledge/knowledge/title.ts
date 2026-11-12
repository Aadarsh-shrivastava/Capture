import type {KnowledgeEntry} from './index';

export const TITLE_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'title.task',
    step: 'title',
    appliesTo: 'Task',
    summary: 'A few of the user\'s own words naming the action.',
    body: `Write a short title for this task using the user's own words.

Rules:
- 2 to 5 words. Start with the action.
- Only words from the text. No new words.
- Leave out dates, times, reminders and details ("tomorrow", "at 6 pm", "remind me", "and hit legs").

Examples:
"I need to pick up the dry cleaning tomorrow at 5 and pay the bill" -> Pick up dry cleaning
"have to text sam tonight" -> Text Sam
"eye checkup next tuesday, remind me a day before" -> Eye checkup

Answer with the title only.`,
  },
  {
    id: 'title.subject',
    step: 'title',
    appliesTo: '*',
    summary: 'A few words naming the subject.',
    body: `Write a short title (2 to 5 words) naming what this is about. Prefer the user's words; a better word is fine. No quotes. Don't copy the first words of the text.

Examples:
"yesterday was calm, read a book all evening" -> Calm evening reading
"my locker code is 4471" -> Locker code
"what if the fridge could order milk" -> Fridge orders milk

Answer with the title only.`,
  },
];
