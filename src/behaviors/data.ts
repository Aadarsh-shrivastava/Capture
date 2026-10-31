import type {CaptureItemDraft} from '@/capture/captureItemDraft';

// Behavior fields are strings; structured values (lists) are JSON-encoded inside them.

export type Step = {text: string; done: boolean};

export function parseJsonArray<T>(value: string | undefined): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export const parseSteps = (value?: string) =>
  parseJsonArray<Step>(value).filter(s => typeof s?.text === 'string' && s.text.trim());
export const parseNumbers = (value?: string) =>
  parseJsonArray<unknown>(value)
    .filter(v => v !== null && v !== '')
    .map(Number)
    .filter(n => Number.isFinite(n));
export const encode = (value: unknown[]) => JSON.stringify(value);

type Draftish = Pick<CaptureItemDraft, 'optionalBehaviorNames' | 'behaviorData'>;

export function hasBehavior(draft: Draftish, name: string): boolean {
  return Boolean(draft.optionalBehaviorNames?.includes(name));
}

export function behaviorData(draft: Draftish, name: string): Record<string, string> {
  return draft.behaviorData?.[name] ?? {};
}

/** Attach a behavior with data, or detach it (null). Works for any optional behavior. */
export function withBehavior<D extends Draftish>(draft: D, name: string, data: Record<string, string> | null): D {
  const names = (draft.optionalBehaviorNames ?? []).filter(n => n !== name);
  const rest = {...draft.behaviorData};
  delete rest[name];
  if (!data) return {...draft, optionalBehaviorNames: names, behaviorData: rest};
  return {...draft, optionalBehaviorNames: [...names, name], behaviorData: {...rest, [name]: data}};
}

/** "now", "5 min", "1 hour", "2 days". */
export function leadLabel(minutes: number): string {
  if (minutes <= 0) return 'now';
  if (minutes % 1440 === 0) return `${minutes / 1440} day${minutes === 1440 ? '' : 's'}`;
  if (minutes % 60 === 0) return `${minutes / 60} hour${minutes === 60 ? '' : 's'}`;
  return `${minutes} min`;
}
