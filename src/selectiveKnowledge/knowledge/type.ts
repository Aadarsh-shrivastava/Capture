import type {KnowledgeEntry} from './index';

export const TYPE_KNOWLEDGE: KnowledgeEntry[] = [
  // Type is two picks (a small model does yes/no far better than a 4-way choice; more questions than this
  // compounded its mistakes — 78% vs 53% type accuracy in the eval):
  // 1. something the user still has to do (now or later)? → Task
  // 2. else: general information → Note; thinking / wondering / imagining → Idea; already happened / their day → Journal.
  {
    id: 'type.isTask',
    step: 'isTask',
    appliesTo: '*',
    summary: 'Is it something the user still has to do?',
    body: `Is this something the user still has to DO, now or later? Errands, calls, appointments, meetings, flights, habits ("every day") and plans with steps are.
Not tasks: general information (facts, addresses, definitions, codes, links), thinking out loud ("what if", "maybe", "imagine", "I wonder"), and things that already happened to the user.

Examples:
"pick up the dry cleaning at 5" -> yes
"eye checkup next tuesday" -> yes
"drink water every morning" -> yes
"organise the trip: book hotel, buy tickets" -> yes
"delhi is the capital of india" -> no
"what if the fridge could order milk" -> no
"yesterday was calm, read a book all evening" -> no

Answer yes or no.`,
  },
  {
    id: 'type.kind',
    step: 'kind',
    appliesTo: '*',
    summary: 'Not a task: information, idea or journal?',
    body: `This is not a task. Which kind is it?

- Note: general information, not about the user's own day: a fact, a definition, an address, a code, a link to read.
- Idea: the user thinking, wondering or imagining: "what if", "maybe", "imagine", "I wonder", "idea".
- Journal: something that already happened to the user, how they feel, or about their own day.

Examples:
"delhi is the capital of india" -> Note
"221b baker street is the address of the museum" -> Note
"useful thread on sql indexing https://example.org/sql" -> Note
"imagine a bike that charges your phone" -> Idea
"I wonder if cats dream" -> Idea
"yesterday was calm, read a book all evening" -> Journal
"lunch with mom was lovely" -> Journal

Answer with ONE word: Note, Idea or Journal.`,
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
