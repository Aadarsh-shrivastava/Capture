import { Ionicons } from '@expo/vector-icons';

import { getTypeBehaviorHint } from '@/domain/behaviorTypeConfig';
import { designTokens } from '@/ui/designTokens';

export type ItemTypeName = 'Task' | 'Note' | 'Journal' | 'Idea';

type ItemTypeConfig = {
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  accentMuted: string;
};

export const ITEM_TYPE_CONFIG: Record<ItemTypeName, ItemTypeConfig> = {
  Task: {
    label: 'Task',
    hint: getTypeBehaviorHint('Task'),
    icon: 'checkmark-circle-outline',
    accent: designTokens.accent,
    accentMuted: designTokens.accentMuted,
  },
  Note: {
    label: 'Note',
    hint: getTypeBehaviorHint('Note'),
    icon: 'document-text-outline',
    accent: '#7a8a99',
    accentMuted: 'rgba(122, 138, 153, 0.16)',
  },
  Journal: {
    label: 'Journal',
    hint: getTypeBehaviorHint('Journal'),
    icon: 'book-outline',
    accent: '#8b7f72',
    accentMuted: 'rgba(139, 127, 114, 0.16)',
  },
  Idea: {
    label: 'Idea',
    hint: getTypeBehaviorHint('Idea'),
    icon: 'bulb-outline',
    accent: '#9a8f3e',
    accentMuted: 'rgba(154, 143, 62, 0.16)',
  },
};

export function getItemTypeConfig(typeName: string): ItemTypeConfig {
  return ITEM_TYPE_CONFIG[typeName as ItemTypeName] ?? {
    label: typeName,
    hint: '',
    icon: 'ellipse-outline',
    accent: designTokens.textTertiary,
    accentMuted: designTokens.surfaceRaised,
  };
}

export const ITEM_TYPE_ORDER: ItemTypeName[] = ['Task', 'Note', 'Journal', 'Idea'];
