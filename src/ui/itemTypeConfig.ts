import { Ionicons } from '@expo/vector-icons';

import { designTokens } from '@/ui/designTokens';

export type ItemTypeName = 'Task' | 'Note' | 'Journal' | 'Idea';

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

export const ITEM_TYPE_CONFIG: Record<ItemTypeName, ItemTypeConfig> = {
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
  return ITEM_TYPE_CONFIG[typeName as ItemTypeName] ?? {
    label: typeName,
    plural: typeName,
    description: '',
    icon: 'ellipse-outline',
    accent: designTokens.textSecondary,
    accentMuted: designTokens.chip,
  };
}

export const ITEM_TYPE_ORDER: ItemTypeName[] = ['Task', 'Note', 'Journal', 'Idea'];

/** Types where the main user text lives in `content`, not `title`. */
export function isTextPrimaryType(typeName: string): boolean {
  return typeName === 'Note' || typeName === 'Journal' || typeName === 'Idea';
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
