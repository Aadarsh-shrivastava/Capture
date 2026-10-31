import type {KnowledgeEntry} from './index';

export const GROUP_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'group.pick',
    step: 'group',
    appliesTo: '*',
    summary: 'Pick one existing group or NONE.',
    body: `Does this item clearly belong to one of the groups below?
Most items belong to NO group. If the item is not obviously about a group, answer NONE.

Answer with the group name exactly as written, or NONE.`,
  },
];
