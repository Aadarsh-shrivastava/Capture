import type {KnowledgeEntry} from './index';

export const DESCRIPTION_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'description.fix',
    step: 'description',
    appliesTo: '*',
    summary: "The user's sentence with its grammar fixed — nothing added.",
    body: `Rewrite the user's text as a clean sentence: fix grammar, spelling, capitals and punctuation.
Keep every detail and keep their words. Do not add anything, do not explain, do not summarise.

Examples:
"need to pick up dry cleaning tmrw at 5 and pay the bil" -> Need to pick up the dry cleaning tomorrow at 5 and pay the bill.
"yesterday was calm read a book all evening" -> Yesterday was calm; I read a book all evening.

Answer with the sentence only.`,
  },
];
