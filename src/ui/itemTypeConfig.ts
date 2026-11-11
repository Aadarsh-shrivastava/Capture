import { Ionicons } from '@expo/vector-icons';

import { typeHasBehavior } from '@/domain/behaviorTypeConfig';
import { findType, useItemTypesStore } from '@/itemTypes/store';
import { designTokens } from '@/ui/designTokens';

export type BuiltInTypeName = 'Task' | 'Note' | 'Journal' | 'Idea';
/** Built-in names autocomplete; custom type names are plain strings. */
export type ItemTypeName = BuiltInTypeName | (string & {});

type ItemTypeConfig = {
  label: string;
  /** Library chip / card heading, e.g. "Tasks". */
  plural: string;
  /** One-line card description shown in the Library. */
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  accentMuted: string;
};

const monoAccent = designTokens.textPrimary;
const monoMuted = designTokens.chip;

export const ITEM_TYPE_CONFIG: Record<BuiltInTypeName, ItemTypeConfig> = {
  Task: {
    label: 'Task',
    plural: 'Tasks',
    description: 'Plan, track and complete.',
    icon: 'checkmark-circle-outline',
    accent: monoAccent,
    accentMuted: monoMuted,
  },
  Note: {
    label: 'Note',
    plural: 'Notes',
    description: 'Quick thoughts and details.',
    icon: 'document-text-outline',
    accent: monoAccent,
    accentMuted: monoMuted,
  },
  Journal: {
    label: 'Journal',
    plural: 'Journal',
    description: 'Reflect and stay consistent.',
    icon: 'book-outline',
    accent: monoAccent,
    accentMuted: monoMuted,
  },
  Idea: {
    label: 'Idea',
    plural: 'Ideas',
    description: 'Capture and explore.',
    icon: 'bulb-outline',
    accent: monoAccent,
    accentMuted: monoMuted,
  },
};

export function getItemTypeConfig(typeName: string): ItemTypeConfig {
  const custom = findType(typeName);
  const base = ITEM_TYPE_CONFIG[typeName as BuiltInTypeName] ?? {
    label: typeName,
    plural: typeName,
    description: custom?.description ?? '',
    icon: 'ellipse-outline',
    accent: designTokens.textPrimary,
    accentMuted: designTokens.chip,
  };
  return custom?.icon ? {...base, icon: custom.icon as ItemTypeConfig['icon']} : base;
}

export const ITEM_TYPE_ORDER: BuiltInTypeName[] = ['Task', 'Note', 'Journal', 'Idea'];

/** Built-in types first, then custom ones in creation order. */
export function allTypeNames(): string[] {
  const custom = useItemTypesStore.getState().types.filter((t) => !t.isSystem).map((t) => t.name);
  return [...ITEM_TYPE_ORDER, ...custom];
}

/** Types where the main user text lives in `content`, not `title` (they're Notable). */
export function isTextPrimaryType(typeName: string): boolean {
  return typeHasBehavior(typeName, 'Notable');
}

export function getBodyFieldLabel(typeName: string): string {
  switch (typeName) {
    case 'Journal':
      return 'Entry';
    case 'Idea':
      return 'Idea';
    case 'Note':
      return 'Note';
    default:
      return 'Notes';
  }
}
