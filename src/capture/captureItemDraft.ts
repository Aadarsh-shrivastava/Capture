import {TYPE_DEFAULT_BEHAVIORS} from '@/domain/behaviorTypeConfig';
import type {ItemTypeName} from '@/ui/itemTypeConfig';

export type CaptureItemDraft = {
  typeName: ItemTypeName;
  title: string;
  content?: string | null;
  importance?: number | null;
  urgency?: number | null;
  tagNames?: string[];
  groupNames?: string[];
  optionalBehaviorNames?: string[];
  behaviorData?: Record<string, Record<string, string>>;
};

export const CAPTURE_TYPE_NAMES = ['Task', 'Note', 'Journal', 'Idea'] as const;

export {TYPE_DEFAULT_BEHAVIORS};

export function parseCaptureJson(raw: string): CaptureItemDraft {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in model output');
  }

  const parsed = JSON.parse(candidate.slice(start, end + 1)) as Partial<CaptureItemDraft>;

  if (!parsed.typeName || !CAPTURE_TYPE_NAMES.includes(parsed.typeName as ItemTypeName)) {
    throw new Error(`typeName must be one of: ${CAPTURE_TYPE_NAMES.join(', ')}`);
  }

  if (!parsed.title || typeof parsed.title !== 'string' || !parsed.title.trim()) {
    throw new Error('title is required');
  }

  return {
    typeName: parsed.typeName as ItemTypeName,
    title: parsed.title.trim(),
    content: parsed.content ?? null,
    importance: normalizeScore(parsed.importance),
    urgency: normalizeScore(parsed.urgency),
    tagNames: normalizeStringArray(parsed.tagNames),
    groupNames: normalizeStringArray(parsed.groupNames),
    optionalBehaviorNames: normalizeStringArray(parsed.optionalBehaviorNames),
    behaviorData: parsed.behaviorData ?? {},
  };
}

function normalizeScore(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return Math.min(5, Math.max(1, Math.round(n)));
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string')
    .map(v => v.trim())
    .filter(Boolean);
}
