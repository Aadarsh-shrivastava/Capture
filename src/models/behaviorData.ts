export type DoableData = {
  status: string;
  completedAt: string | null;
  dueAt: string | null;
  estimatedMinutes: number | null;
};

export type MemorableData = {
  reviewAt: string | null;
  lastReviewedAt: string | null;
};

export type VisitableData = {
  url: string;
  title: string | null;
  domain: string | null;
  lastVisitedAt: string | null;
};

export type RepeatableData = {
  intervalValue: number;
  intervalUnit: string;
  nextOccurrenceAt: string | null;
  startAt: string | null;
  endAt: string | null;
};

export type TrackableData = {
  currentValue: number | null;
  targetValue: number | null;
  unit: string | null;
};

export type SchedulableData = {
  startsAt: string | null;
  endsAt: string | null;
  timezone: string | null;
};

export type BehaviorDataMap = Record<string, Record<string, string>>;

export type ItemFull = {
  id: number;
  typeId: number;
  typeName: string;
  title: string;
  content: string | null;
  importance: number | null;
  urgency: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  defaultBehaviorIds: number[];
  optionalBehaviorIds: number[];
  effectiveBehaviors: { id: number; name: string }[];
  behaviorData: BehaviorDataMap;
  groupIds: number[];
  tagNames: string[];
};

export type SaveItemPayload = {
  typeId: number;
  title: string;
  content?: string | null;
  importance?: number | null;
  urgency?: number | null;
  status?: string;
  optionalBehaviorIds: number[];
  behaviorData: BehaviorDataMap;
  groupIds: number[];
  tagNames: string[];
};
