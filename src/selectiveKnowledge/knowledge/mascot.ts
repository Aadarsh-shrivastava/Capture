import type {KnowledgeEntry} from './index';

export const MASCOT_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'mascot.pick',
    step: 'mascot',
    appliesTo: '*',
    summary: 'Which sticker fits this item?',
    // The options list (name: what it fits) is appended by the agent from src/mascot/itemMascots.ts.
    body: `Pick the sticker that best matches what this item is about. Choose from the list below.

Examples:
"pick up the dry cleaning" -> laundry
"text sam about saturday" -> chat
"bake banana bread" -> cook

Answer with ONE sticker name from the list.`,
  },
];
