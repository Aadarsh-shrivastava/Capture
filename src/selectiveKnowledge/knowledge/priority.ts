import type {KnowledgeEntry} from './index';

export const PRIORITY_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'priority.task',
    step: 'priority',
    appliesTo: '*',
    summary: 'Urgent and/or important, from what the user said.',
    body: `How pressing is this task, going only by what the user said?

- urgent: they say it can't wait ("asap", "urgent", "right now", "before it's too late", a deadline very soon).
- important: they say it matters a lot (health, money, job, family, "really need to", "must").
- both: urgent and important.
- normal: anything else. Most tasks are normal.

Answer with ONE word only: urgent, important, both or normal.`,
  },
];
