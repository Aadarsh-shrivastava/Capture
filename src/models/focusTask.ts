import type {ItemWithType} from '@/models/item';

/** Task item enriched with Doable behavior fields for Focus. */
export type FocusTask = ItemWithType & {
  doableStatus: string;
  dueAt: string | null;
  completedAt: string | null;
  estimatedMinutes: number | null;
};

