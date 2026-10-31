import type {ItemTypeName} from '@/ui/itemTypeConfig';

import {DATETIME_KNOWLEDGE} from './datetime';
import {DESCRIPTION_KNOWLEDGE} from './description';
import {GROUP_KNOWLEDGE} from './group';
import {TITLE_KNOWLEDGE} from './title';
import {TYPE_KNOWLEDGE} from './type';

export type KnowledgeStep = 'type' | 'title' | 'description' | 'datetime' | 'group';

export type KnowledgeEntry = {
  id: string;
  step: KnowledgeStep;
  /** Item type this entry is for; '*' is the fallback for any type. */
  appliesTo: ItemTypeName | '*';
  summary: string;
  /** The guideline text the model reads for this step. */
  body: string;
};

/** The index: every knowledge file, looked up by step + item type. */
export const KNOWLEDGE_INDEX: KnowledgeEntry[] = [
  ...TYPE_KNOWLEDGE,
  ...TITLE_KNOWLEDGE,
  ...DESCRIPTION_KNOWLEDGE,
  ...DATETIME_KNOWLEDGE,
  ...GROUP_KNOWLEDGE,
];

export function findKnowledge(step: KnowledgeStep, type?: ItemTypeName): KnowledgeEntry {
  const entry =
    KNOWLEDGE_INDEX.find(e => e.step === step && e.appliesTo === type) ??
    KNOWLEDGE_INDEX.find(e => e.step === step && e.appliesTo === '*');
  if (!entry) throw new Error(`No knowledge for step "${step}"`);
  return entry;
}
