import { findType } from '@/itemTypes/store';
import type { ItemTypeName } from '@/ui/itemTypeConfig';

/** Internal behavior keys — never shown directly in UI. */
export type BehaviorName =
  | 'Doable'
  | 'Notable'
  | 'Memorable'
  | 'Visitable'
  | 'Repeatable'
  | 'Trackable'
  | 'Schedulable'
  | 'Divisible'
  | 'Remindable';

export const ALL_BEHAVIOR_NAMES = [
  'Doable',
  'Notable',
  'Memorable',
  'Visitable',
  'Repeatable',
  'Trackable',
  'Schedulable',
  'Divisible',
  'Remindable',
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
  Divisible: {
    label: 'Break into steps',
    includedHint: 'always on',
    formSectionTitle: 'Steps',
    addPrompt: 'Add steps',
  },
  Remindable: {
    label: 'Custom reminders',
    includedHint: 'always on',
    formSectionTitle: 'Reminders',
    addPrompt: 'Set reminders',
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
    optionalAllowed: ['Schedulable', 'Repeatable', 'Trackable', 'Visitable', 'Divisible', 'Remindable'],
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
    defaults: ['Notable', 'Memorable'],
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

// Types come from the DB registry (user-manageable); built-in rules are the fallback before it loads.

export function getDefaultBehaviorsForType(typeName: string): string[] {
  return findType(typeName)?.defaults ?? TYPE_BEHAVIOR_RULES[typeName as keyof typeof TYPE_BEHAVIOR_RULES]?.defaults ?? [];
}

export function getAllowedOptionalBehaviorsForType(typeName: string): string[] {
  return findType(typeName)?.optional ?? TYPE_BEHAVIOR_RULES[typeName as keyof typeof TYPE_BEHAVIOR_RULES]?.optionalAllowed ?? [];
}

/** All behaviors relevant to UI for a type: defaults + allowed optional toggles. */
export function getBehaviorsForTypeUI(typeName: string): string[] {
  return [...getDefaultBehaviorsForType(typeName), ...getAllowedOptionalBehaviorsForType(typeName)];
}

/** Type always has this behavior (e.g. Doable → shows on Focus, gets reminders). */
export function typeHasBehavior(typeName: string, behavior: string): boolean {
  return getDefaultBehaviorsForType(typeName).includes(behavior);
}

/** Type has or may add this behavior (shows its field in the form). */
export function typeAllowsBehavior(typeName: string, behavior: string): boolean {
  return getBehaviorsForTypeUI(typeName).includes(behavior);
}

export function isOptionalBehaviorAllowed(typeName: string, behaviorName: string): boolean {
  return getAllowedOptionalBehaviorsForType(typeName).includes(behaviorName);
}

export function filterValidOptionalBehaviors(typeName: string, behaviorNames: string[]): string[] {
  const allowed = new Set(getAllowedOptionalBehaviorsForType(typeName));
  return behaviorNames.filter((name) => allowed.has(name));
}
