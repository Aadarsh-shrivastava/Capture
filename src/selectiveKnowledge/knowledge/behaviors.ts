import type {KnowledgeEntry} from './index';

// One small guide per behavior step. The agent only runs a step if the item's type allows that behavior.
export const BEHAVIOR_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'memorable.weight',
    step: 'memorable',
    appliesTo: '*',
    summary: 'How often should this come back to the user?',
    body: `How often should this come back to the user later, so it is not forgotten? Answer with ONE word:
often | sometimes | rarely | never

often: an open question or something they clearly want to pursue
sometimes: an idea, a plan, a link to read
rarely: reference info worth a look now and then
never: plain facts, passwords, done things

Examples:
"how do chinese models run so cheaply?" -> often
"app idea: habit tracker that uses voice" -> sometimes
"wifi password is abc123" -> never`,
  },
  {
    id: 'repeat.detect',
    step: 'repeat',
    appliesTo: '*',
    summary: 'Does it repeat, and how often?',
    body: `Does this repeat? Answer with ONE of:
daily | weekly | monthly | weekly on mon,wed,fri (list the days) | NONE

Examples:
"gym every monday and friday" -> weekly on mon,fri
"water plants every day" -> daily
"pay rent on the 1st each month" -> monthly
"call mom tomorrow" -> NONE`,
  },
  {
    id: 'remind.detect',
    step: 'remind',
    appliesTo: '*',
    summary: 'When to remind before it is due.',
    body: `When should the user be reminded? Answer like:
30 minutes before | 1 hour before | 1 day before | at the time | NONE

Examples:
"remind me an hour before the meeting" -> 1 hour before
"dentist at 5, ping me 15 min earlier" -> 15 minutes before
"buy milk" -> NONE`,
  },
  {
    id: 'steps.detect',
    step: 'steps',
    appliesTo: '*',
    summary: 'Split into separate steps.',
    body: `List the separate steps in this text, one per line, short (2-5 words each).
If it is a single action, answer NONE.

Example:
"pack for trip: passport, charger, and sunscreen" ->
Passport
Charger
Sunscreen`,
  },
];
