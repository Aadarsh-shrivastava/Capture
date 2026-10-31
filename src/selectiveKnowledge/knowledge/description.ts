import type {KnowledgeEntry} from './index';

export const DESCRIPTION_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'description.task',
    step: 'description',
    appliesTo: 'Task',
    summary: 'Extra task detail not already in the title or date.',
    body: `Write a one-sentence description with details that are NOT in the title and NOT a date or time.

Examples:
"go to gym tomorrow at 6 pm and hit those leg muscles" (title: Go to gym) -> Focus on leg muscles.
"call mom tonight" (title: Call mom) -> NONE

If there is nothing extra, answer NONE. Answer with the description only.`,
  },
];
