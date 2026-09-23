import type { ItemTypeName } from '@/ui/itemTypeConfig';

/** Internal behavior keys — never shown directly in UI. */
export type BehaviorName =
  | 'Doable'
  | 'Notable'
  | 'Memorable'
  | 'Visitable'
  | 'Repeatable'
  | 'Trackable'
  | 'Schedulable';

export const ALL_BEHAVIOR_NAMES = [
  'Doable',
  'Notable',
  'Memorable',
  'Visitable',
  'Repeatable',
  'Trackable',
  'Schedulable',
] as const satisfies readonly BehaviorName[];

type BehaviorUiCopy = {
  /** Checkbox / chip label */
  label: string;
  /** Short subtitle on locked (type-default) rows */
  includedHint: string;
  /** Form section heading when behavior has fields */
  formSectionTitle: string;
  /** Detail screen “add” button copy */
  addPrompt: string;
};

export const BEHAVIOR_UI: Record<BehaviorName, BehaviorUiCopy> = {
  Doable: {
    label: 'Can be completed',
    includedHint: 'always on for tasks',
    formSectionTitle: 'Completion details',
    addPrompt: 'Make it actionable',
  },
  Notable: {
    label: 'Save as reference',
    includedHint: 'always on',
    formSectionTitle: 'Reference',
    addPrompt: 'Save as reference',
  },
  Memorable: {
    label: 'Save as memory',
    includedHint: 'always on',
    formSectionTitle: 'Memory & review',
    addPrompt: 'Save as memory',
  },
  Visitable: {
    label: 'Include a link',
    includedHint: 'always on',
    formSectionTitle: 'Link details',
    addPrompt: 'Add a link',
  },
  Repeatable: {
    label: 'Is this repeatable?',
    includedHint: 'always on',
    formSectionTitle: 'Repeat schedule',
    addPrompt: 'Make it repeatable',
  },
  Trackable: {
    label: 'Track progress',
    includedHint: 'always on',
    formSectionTitle: 'Progress tracking',
    addPrompt: 'Track progress',
  },
  Schedulable: {
    label: 'Schedule a time',
    includedHint: 'always on',
    formSectionTitle: 'Schedule',
    addPrompt: 'Add a schedule',
  },
};

type TypeBehaviorRules = {
  /** Locked defaults for this item type */
  defaults: BehaviorName[];
  /** Optional behaviors the user may toggle on */
  optionalAllowed: BehaviorName[];
  /** Friendly subtitle shown under type name */
  typeHint: string;
};

/**
 * Per-type behavior limits. Defaults are always applied; optional behaviors
 * are the only ones shown as toggles and may be added on the detail screen.
 */
export const TYPE_BEHAVIOR_RULES: Record<ItemTypeName, TypeBehaviorRules> = {
  Task: {
    defaults: ['Doable'],
    optionalAllowed: ['Schedulable', 'Repeatable', 'Trackable', 'Visitable'],
    typeHint: 'Actionable',
  },
  Note: {
    defaults: ['Notable'],
    optionalAllowed: ['Visitable', 'Memorable'],
    typeHint: 'For reference',
  },
  Journal: {
    defaults: ['Notable', 'Memorable'],
    optionalAllowed: ['Visitable'],
    typeHint: 'Reflective · worth remembering',
  },
  Idea: {
    defaults: ['Notable'],
    optionalAllowed: ['Visitable'],
    typeHint: 'Quick capture',
  },
};

/** @deprecated Use TYPE_BEHAVIOR_RULES[type].defaults — kept for capture/AI paths */
export const TYPE_DEFAULT_BEHAVIORS: Record<ItemTypeName, BehaviorName[]> = {
  Task: TYPE_BEHAVIOR_RULES.Task.defaults,
  Note: TYPE_BEHAVIOR_RULES.Note.defaults,
  Journal: TYPE_BEHAVIOR_RULES.Journal.defaults,
  Idea: TYPE_BEHAVIOR_RULES.Idea.defaults,
};

export function getBehaviorLabel(name: string): string {
  return BEHAVIOR_UI[name as BehaviorName]?.label ?? name;
}

export function getBehaviorFormTitle(name: string): string {
  return BEHAVIOR_UI[name as BehaviorName]?.formSectionTitle ?? getBehaviorLabel(name);
}

export function getBehaviorAddPrompt(name: string): string {
  return BEHAVIOR_UI[name as BehaviorName]?.addPrompt ?? getBehaviorLabel(name);
}

export function getBehaviorIncludedHint(name: string): string {
  return BEHAVIOR_UI[name as BehaviorName]?.includedHint ?? 'included';
}

export function getTypeBehaviorHint(typeName: string): string {
  return TYPE_BEHAVIOR_RULES[typeName as ItemTypeName]?.typeHint ?? '';
}

export function getDefaultBehaviorsForType(typeName: string): string[] {
  return TYPE_BEHAVIOR_RULES[typeName as ItemTypeName]?.defaults ?? [];
}

export function getAllowedOptionalBehaviorsForType(typeName: string): string[] {
  return TYPE_BEHAVIOR_RULES[typeName as ItemTypeName]?.optionalAllowed ?? [];
}

/** All behaviors relevant to UI for a type: defaults + allowed optional toggles. */
export function getBehaviorsForTypeUI(typeName: string): string[] {
  const rules = TYPE_BEHAVIOR_RULES[typeName as ItemTypeName];
  if (!rules) return [];
  return [...rules.defaults, ...rules.optionalAllowed];
}

export function isOptionalBehaviorAllowed(typeName: string, behaviorName: string): boolean {
  return getAllowedOptionalBehaviorsForType(typeName).includes(behaviorName);
}

export function filterValidOptionalBehaviors(typeName: string, behaviorNames: string[]): string[] {
  const allowed = new Set(getAllowedOptionalBehaviorsForType(typeName));
  return behaviorNames.filter((name) => allowed.has(name));
}
