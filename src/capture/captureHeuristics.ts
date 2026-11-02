import {typeHasBehavior} from '@/domain/behaviorTypeConfig';
import { inferDueAtFromText } from '@/capture/captureDateContext';
import { useItemTypesStore } from '@/itemTypes/store';
import { bestTypeByKeywords } from '@/selectiveKnowledge/typeKeywords';
import type { CaptureItemDraft } from '@/capture/captureItemDraft';
import { extractCaptureTitle, extractShortSubject } from '@/capture/captureTitle';
import {
  inferGroupsFromGuide,
  inferImportanceFromGuide,
  inferTagsFromGuide,
  inferTypeFromGuide,
  inferUrgencyFromGuide,
} from '@/capture/captureHeuristicsGuide';
import {
  filterValidOptionalBehaviors,
  getDefaultBehaviorsForType,
} from '@/domain/behaviorTypeConfig';
// Pure util path: the module entry also exports UI, which plain-logic callers shouldn't load.
import { inferRepeatUnit } from '@/recurrence/utils';
import type { ItemTypeName } from '@/ui/itemTypeConfig';

const URL_RE = /https?:\/\/[^\s<>"{}|\\^`[\]]+/i;
const REPEAT_RE = /\b(every|daily|weekly|monthly|recurring|repeat|routine|habit)\b/i;
const SCHEDULE_RE =
  /\b(at \d|from \d|between \d|\d:\d{2}\s*(am|pm)?|meeting|appointment|calendar|booked)\b/i;
const URGENT_RE = /\b(asap|urgent|immediately|right now|today|tonight|tomorrow|eod)\b/i;

function extractUrl(text: string): string | null {
  const match = text.match(URL_RE);
  return match?.[0] ?? null;
}

function inferTitle(text: string, typeName: ItemTypeName): string {
  if (typeHasBehavior(typeName, 'Doable')) return extractCaptureTitle(text, typeName);
  return extractShortSubject(text, typeName);
}

function inferContent(text: string, typeName: ItemTypeName): string | null {
  if (typeHasBehavior(typeName, 'Doable')) return null;
  const trimmed = text.trim();
  return trimmed || null;
}

function inferOptionalBehaviors(text: string, typeName: ItemTypeName): string[] {
  const optional: string[] = [];
  const lower = text.toLowerCase();

  if (extractUrl(text)) optional.push('Visitable');
  if (typeHasBehavior(typeName, 'Doable')) {
    if (REPEAT_RE.test(lower)) optional.push('Repeatable');
    if (SCHEDULE_RE.test(lower) || URGENT_RE.test(lower)) optional.push('Schedulable');
    if (/\b(\d+\s*(kg|lbs|pages|steps|reps|units|percent|%)|track|progress|goal)\b/i.test(lower)) {
      optional.push('Trackable');
    }
  }

  return filterValidOptionalBehaviors(typeName, optional);
}

function inferBehaviorData(
  text: string,
  typeName: ItemTypeName,
  optionalBehaviorNames: string[],
  now: Date,
): Record<string, Record<string, string>> {
  const data: Record<string, Record<string, string>> = {};
  const effective = new Set([
    ...getDefaultBehaviorsForType(typeName),
    ...optionalBehaviorNames,
  ]);

  if (effective.has('Doable')) {
    const dueAt = inferDueAtFromText(text, now);
    data.Doable = {
      status: 'pending',
      due_at: dueAt,
      estimated_minutes: '',
    };
  }

  const url = extractUrl(text);
  if (effective.has('Visitable') && url) {
    data.Visitable = { url, title: inferTitle(text, typeName) };
  }

  if (effective.has('Repeatable')) {
    data.Repeatable = {
      interval_value: '1',
      interval_unit: inferRepeatUnit(text),
      next_occurrence_at: '',
      start_date: '',
      end_date: '',
    };
  }

  return data;
}

function customTypeFor(text: string): string | undefined {
  const custom = useItemTypesStore.getState().types.filter((t) => !t.isSystem);
  return bestTypeByKeywords(custom, text)?.name;
}

/**
 * Rule-based capture analysis — uses captureHeuristicsGuide.ts.
 * LLM prompt includes the same guide via formatHeuristicsGuideForPrompt().
 */
export function analyzeCaptureText(
  rawText: string,
  overrides?: Partial<CaptureItemDraft>,
  now = new Date(),
): CaptureItemDraft {
  const text = rawText.trim();
  // A custom type the text clearly points to (by its keywords) wins over the built-in guess.
  const typeName = overrides?.typeName ?? customTypeFor(text) ?? inferTypeFromGuide(text);
  const optionalBehaviorNames =
    overrides?.optionalBehaviorNames ?? inferOptionalBehaviors(text, typeName);

  const title = overrides?.title?.trim() || inferTitle(text, typeName) || 'Untitled';

  return {
    typeName,
    title,
    content: overrides?.content ?? inferContent(text, typeName),
    importance: overrides?.importance ?? inferImportanceFromGuide(text, typeName),
    urgency: overrides?.urgency ?? inferUrgencyFromGuide(text, typeName),
    tagNames: overrides?.tagNames ?? inferTagsFromGuide(text, typeName),
    groupNames: overrides?.groupNames ?? inferGroupsFromGuide(text),
    optionalBehaviorNames,
    behaviorData:
      overrides?.behaviorData ??
      inferBehaviorData(text, typeName, optionalBehaviorNames, now),
  };
}
