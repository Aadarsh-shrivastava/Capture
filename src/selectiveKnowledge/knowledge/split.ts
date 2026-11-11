import type {KnowledgeEntry} from './index';

export const SPLIT_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'split.same',
    step: 'split',
    appliesTo: '*',
    summary: 'Are two neighbouring pieces of a dump about the same thing?',
    body: `The user said two things, A and B, one after the other. Are they about the same thing — the same task, plan, event, story or topic?
Details of one task are the same thing. Two different errands are not.

Examples:
A: go to the gym / B: do chest day -> yes
A: finish the deck / B: email it to sam -> yes
A: dinner was lovely / B: everyone loved the cake -> yes
A: go to the gym / B: withdraw cash -> no
A: buy eggs / B: what is a hash map -> no
A: had a calm morning / B: need to renew the car insurance -> no

Answer yes or no.`,
  },
];
