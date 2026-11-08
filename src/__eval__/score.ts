import moment from 'moment';

import {parseNumbers, parseSteps} from '@/behaviors/data';
import type {CaptureItemDraft} from '@/capture/captureItemDraft';
import {inventedWords} from '@/selectiveKnowledge/extract';
import {hasTimeComponent} from '@/ui/formatDateTime';

import type {CaptureCase} from './captureCases';

/** A task title should be the action, not when: these mean the date leaked into it. */
const DATE_WORDS = /\b(today|tonight|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}(:\d{2})?\s*(am|pm)|at \d)\b/i;

export {inventedWords};

export type FieldResult = {field: string; ok: boolean; expected: string; got: string};

const sameList = (a: number[], b: number[]) => [...a].sort().join(',') === [...b].sort().join(',');

/** Score one draft against its case: one result per field. Unstated fields must be absent. */
export function scoreCase(c: CaptureCase, draft: CaptureItemDraft): FieldResult[] {
  const out: FieldResult[] = [];
  const add = (field: string, ok: boolean, expected: unknown, got: unknown) =>
    out.push({field, ok, expected: JSON.stringify(expected), got: JSON.stringify(got)});
  const data = draft.behaviorData ?? {};

  add('type', draft.typeName === c.type, c.type, draft.typeName);

  if (c.title) add('title', c.title.every(w => draft.title.toLowerCase().includes(w.toLowerCase())), c.title, draft.title);
  const titleInvented = inventedWords(draft.title, c.text);
  add('title invents nothing', titleInvented.length === 0, 'only words from the text', titleInvented);

  // A description may rephrase, but must not add facts the user never gave.
  const content = draft.content?.trim() ?? '';
  const contentInvented = inventedWords(content, c.text);
  add('description invents nothing', contentInvented.length <= 1, 'at most 1 new word', contentInvented);

  if (c.type === 'Task') {
    add('title without date', !DATE_WORDS.test(draft.title), 'no date words', draft.title);

    const due = data.Doable?.due_at ?? '';
    const want = c.due ?? 'none';
    let ok: boolean;
    if (want === 'none') ok = !due;
    else if (want === 'any') ok = !!due;
    else {
      const m = moment(due);
      ok = !!due && m.format('YYYY-MM-DD') === want.date && (!want.time || (hasTimeComponent(due) && m.format('HH:mm') === want.time));
    }
    add(want === 'none' ? 'no date invented' : 'due', ok, want, due);
  }

  const r = data.Repeatable;
  if (c.repeat) {
    add('repeat', r?.interval_unit === c.repeat.unit && (!c.repeat.days || sameList(parseNumbers(r?.days), c.repeat.days)), c.repeat, r ?? null);
  } else {
    add('no repeat invented', !r, 'none', r ?? null);
  }

  const offsets = parseNumbers(data.Remindable?.offsets);
  if (c.remind) add('remind', sameList(offsets, c.remind), c.remind, offsets);
  else add('no reminder invented', offsets.length === 0, 'none', offsets);

  const steps = parseSteps(data.Divisible?.steps ?? '[]');
  if (c.steps != null) add('steps', steps.length === c.steps, c.steps, steps.map(s => s.text));
  else add('no steps invented', steps.length === 0, 'none', steps.map(s => s.text));

  if (c.priority) {
    const got = draft.urgency === 5 && draft.importance === 5 ? 'both' : draft.urgency === 5 ? 'urgent' : draft.importance === 5 ? 'important' : 'normal';
    add('priority', got === c.priority || (got === 'both' && c.priority !== 'normal'), c.priority, got);
  }

  if (c.url) add('link', data.Visitable?.url === c.url, c.url, data.Visitable?.url ?? null);

  return out;
}

/** Per-field pass rate, e.g. {due: {passed: 11, total: 14}}. */
export function tally(results: FieldResult[]): Record<string, {passed: number; total: number}> {
  const t: Record<string, {passed: number; total: number}> = {};
  for (const r of results) {
    t[r.field] ??= {passed: 0, total: 0};
    t[r.field].total += 1;
    if (r.ok) t[r.field].passed += 1;
  }
  return t;
}
