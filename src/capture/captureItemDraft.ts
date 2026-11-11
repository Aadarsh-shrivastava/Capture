import {TYPE_DEFAULT_BEHAVIORS} from '@/domain/behaviorTypeConfig';
import type {ItemTypeName} from '@/ui/itemTypeConfig';

export type CaptureItemDraft = {
  typeName: ItemTypeName;
  title: string;
  content?: string | null;
  /** Sticker key (src/mascot/itemMascots.ts). */
  mascot?: string | null;
  /** The model guessed "something to do" without the user's words saying so: ask before trusting it. */
  unsure?: boolean;
  importance?: number | null;
  urgency?: number | null;
  tagNames?: string[];
  groupNames?: string[];
  optionalBehaviorNames?: string[];
  behaviorData?: Record<string, Record<string, string>>;
};

export const CAPTURE_TYPE_NAMES = ['Task', 'Note', 'Journal', 'Idea'] as const;

export {TYPE_DEFAULT_BEHAVIORS};
