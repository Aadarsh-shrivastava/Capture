import type {CaptureItemDraft} from '@/capture/captureItemDraft';

import {inventedWords, scoreCase} from './score';

const task = (dueAt: string, extra: Partial<CaptureItemDraft> = {}): CaptureItemDraft => ({
  typeName: 'Task',
  title: 'Go to gym',
  content: null,
  behaviorData: {Doable: {status: 'pending', due_at: dueAt, estimated_minutes: ''}},
  ...extra,
});
const gym = {text: 'gym tomorrow at 7am', type: 'Task' as const, title: ['gym'], due: {date: '2026-11-01', time: '07:00'}};
const failed = (c: typeof gym | {text: string; type: 'Task'}, d: CaptureItemDraft) => scoreCase(c, d).filter(r => !r.ok).map(r => r.field);

test('scorer: a correct draft passes every field', () => {
  expect(failed(gym, task('2026-11-01T07:00:00+05:30'))).toEqual([]);
});

test('scorer: wrong time, a date in the title, invented words all fail', () => {
  expect(failed(gym, task('2026-11-01T19:00:00+05:30'))).toEqual(['due']);
  expect(failed(gym, task('2026-11-01T07:00:00+05:30', {title: 'Gym tomorrow at 7am'}))).toContain('title without date');
  expect(failed(gym, task('2026-11-01T07:00:00+05:30', {content: 'Leg day with protein shake and stretching'}))).toContain('description invents nothing');
});

test('scorer: anything the user never said is a failure (ghost date / repeat / reminder / steps)', () => {
  const plain = {text: 'buy groceries', type: 'Task' as const};
  const ghost = task('2026-11-01', {
    title: 'Buy groceries',
    behaviorData: {
      Doable: {status: 'pending', due_at: '2026-11-01', estimated_minutes: ''},
      Repeatable: {interval_value: '1', interval_unit: 'week', days: '[1]'},
      Remindable: {offsets: '[60]'},
    },
  });
  expect(failed(plain, ghost)).toEqual(['no date invented', 'no repeat invented', 'no reminder invented']);
});

test('invented words: stems and filler are fine, new facts are not', () => {
  expect(inventedWords('Fix the leaky tap', 'fix the leaking tap')).toEqual([]);
  expect(inventedWords('Buy groceries and protein powder', 'buy groceries')).toEqual(['protein', 'powder']);
});
