import type {KnowledgeEntry} from './index';

export const DATETIME_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'datetime.phrase',
    step: 'datetime',
    appliesTo: '*',
    summary: 'Copy the date/time words; code resolves them.',
    body: `Copy the exact words from the text that say WHEN. Do not calculate dates.

Look for: today, tonight, tomorrow, weekdays (this Sunday, next Friday), "at 6 pm", "at 5", "in 2 hours", eod.

Examples:
"go to gym tomorrow at 6 pm" -> tomorrow at 6 pm
"call mom in 2 hours" -> in 2 hours
"read about rust" -> NONE

Answer with the words only, or NONE.`,
  },
];
