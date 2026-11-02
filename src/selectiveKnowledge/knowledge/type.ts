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
  {
    id: 'type.custom',
    step: 'customType',
    appliesTo: '*',
    summary: "Narrow down to one of the user's own types.",
    body: `The user has their own item types, listed below with what each is for.
The text mentions something related to them. If the item is one of these types, answer that name.
Links, dates or notes in the text do not matter — pick by what the item IS.

Answer with the type name exactly as written, or NONE.`,
  },
  {
    id: 'type.keywords',
    step: 'typeKeywords',
    appliesTo: '*',
    summary: 'Expand a type into words people use for it.',
    body: `List 20 single words someone might use when writing about this kind of item:
synonyms, related things, verbs and places. Lowercase, separated by commas. No sentences.

Example — Workout: gym training:
gym, workout, exercise, training, run, lift, cardio, legs, weights, yoga, swim, sets, reps, coach, stretch, fitness, squat, bench, jog, sport`,
  },
];
