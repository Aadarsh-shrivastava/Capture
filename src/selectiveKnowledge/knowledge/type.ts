import type {KnowledgeEntry} from './index';

export const TYPE_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'type.classify',
    step: 'type',
    appliesTo: '*',
    summary: 'Pick Task, Note, Journal or Idea from signal phrases.',
    body: `Classify the user's text into exactly one type.

- Task: something to do. Signals: "I need to", "I have to", "I want to", "I should", "remind me", "buy", "call", "go to", "finish", a date or time.
- Note: a fact or reference to keep. Signals: "X is", definitions, links, how-to, snippets.
- Journal: personal experience or feelings. Signals: "today was", "I felt", "I had fun", past tense about my day.
- Idea: a loose thought, not committed. Signals: "what if", "maybe", "idea:", "could build".

Answer with ONE word only: Task, Note, Journal or Idea.`,
  },
];
