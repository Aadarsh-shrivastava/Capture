import type {KnowledgeEntry} from './index';

export const TITLE_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'title.task',
    step: 'title',
    appliesTo: 'Task',
    summary: 'Short action title, no dates or times.',
    body: `Write a title for this task.

Rules:
- 2 to 6 words, start with a verb.
- Remove dates, times, urgency words and filler ("I need to", "tomorrow", "at 6 pm").
- Keep the main action and object only.

Examples:
"I need to go to gym tomorrow at 6 pm and hit legs" -> Go to gym
"have to call mom tonight" -> Call mom
"buy milk and eggs today its urgent" -> Buy milk and eggs

Answer with the title only.`,
  },
  {
    id: 'title.subject',
    step: 'title',
    appliesTo: '*',
    summary: 'Short subject for notes, journals and ideas.',
    body: `Write a short title (2 to 6 words) naming the subject of the text.
Do not copy the whole text. No quotes.

Examples:
"Today was great, went hiking with friends" -> Hiking with friends
"IDOR is when an app exposes object ids" -> IDOR vulnerability
"what if the app suggested my next task" -> Next task suggestions

Answer with the title only.`,
  },
];
