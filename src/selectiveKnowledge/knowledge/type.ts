import type {KnowledgeEntry} from './index';

export const TYPE_KNOWLEDGE: KnowledgeEntry[] = [
  // Everything is a thought; yes/no judgments attach what it needs (a small model does yes/no far better than
  // picking a type): something to do? → Task (Focus). Else about their day? → Journal. Else comes back later? → Memorable.
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
    id: 'type.isDay',
    step: 'isDay',
    appliesTo: '*',
    summary: "Is it about the user's own day?",
    body: `Is the user telling about their own day — something that already happened to them, or how they feel?
Facts, plans and ideas are not.

Examples:
"yesterday was calm, read a book all evening" -> yes
"felt proud after finishing the run" -> yes
"lunch with mom was lovely" -> yes
"delhi is the capital of india" -> no
"what if the fridge could order milk" -> no

Answer yes or no.`,
  },
  {
    id: 'type.comesBack',
    step: 'comesBack',
    appliesTo: '*',
    summary: 'Worth bringing back later?',
    body: `Should this come back to the user later, so it isn't forgotten? Yes for an open question, an idea they might pursue, or something to read or watch.
No for plain facts kept for reference: codes, passwords, sizes, addresses.

Examples:
"what if the fridge could order milk" -> yes
"why do cats purr?" -> yes
"useful thread on sql indexing https://example.org/sql" -> yes
"my locker code is 4471" -> no
"221b baker street is the address of the museum" -> no

Answer yes or no.`,
  },
];
