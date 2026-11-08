import type {KnowledgeEntry} from './index';

export const SPLIT_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'split.thoughts',
    step: 'split',
    appliesTo: '*',
    summary: 'Split a brain dump only where the topics are unrelated.',
    body: `Split the text into separate items ONLY where the user talks about completely unrelated things.
Copy the user's words; do not add, explain or number. One item per line.

Keep together (ONE line):
- details of the same task: "go to the gym and do chest day" is one task
- steps of one plan: "book the hotel and pack the bags for the trip"
- a story about one day or one feeling

Split (separate lines): things that have nothing to do with each other: "go to the gym, withdraw cash".

Examples:
go to the gym and do chest day
→
go to the gym and do chest day

go to the gym and withdraw cash, also what is a hash map
→
go to the gym
withdraw cash
what is a hash map`,
  },
];
