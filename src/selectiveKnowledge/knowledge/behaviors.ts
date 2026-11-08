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
];
