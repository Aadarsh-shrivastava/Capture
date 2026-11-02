import type {KnowledgeEntry} from './index';

export const SPLIT_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'split.thoughts',
    step: 'split',
    appliesTo: '*',
    summary: 'Split a brain dump into separate thoughts.',
    body: `Split the text into separate thoughts, one per line. Copy the user's words; do not add, explain or number.
A thought is one task, question, idea or note. Sentences about the same thing stay together on one line.
A journal entry or a note about one topic is ONE line.

Example:
need protein shake before gym. btw what does xyz mean. must apply to jobs, running out of time
→
need protein shake before gym
what does xyz mean
must apply to jobs, running out of time`,
  },
];
