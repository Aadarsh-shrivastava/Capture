import moment from 'moment';

import type {FocusTask} from '@/models/focusTask';
import {parsePendingEntry} from '@/native/homeWidgetCapture';

import {widgetTimeline} from './syncHomeWidgetFocus';

jest.mock('@/repositories/focusRepository', () => ({focusRepository: {}}));
jest.mock('@/mascot', () => ({useMascotStore: {getState: () => ({character: 'male'})}}));

const at = (h: number) => new Date(2026, 9, 31, h).toISOString();
const task = (id: number, dueAt: string) =>
  ({id, dueAt, title: `t${id}`, importance: null, urgency: null, doableStatus: 'pending'}) as FocusTask;

test('widget shows a later task, marks it overdue once due, and carries it into tomorrow', () => {
  const start = moment(new Date(2026, 9, 31, 8));
  const entries = widgetTimeline([task(1, at(15))], start);
  expect(entries.map(e => [new Date(e.at).getHours(), e.title, e.subtitle?.startsWith('Overdue') ?? false])).toEqual([
    [8, 't1', false], // next task later today
    [15, 't1', true], // 14:00 shows the same thing, so it's dropped; just after 15:00 it goes overdue
    [0, 't1', true], // midnight: still overdue, now "1 day overdue"
  ]);
});

test('native capture entries: JSON with time, or a plain legacy string', () => {
  expect(parsePendingEntry('{"text":" gym tomorrow ","at":1000}')).toEqual({text: 'gym tomorrow', at: new Date(1000)});
  expect(parsePendingEntry('call mom').text).toBe('call mom');
  expect(parsePendingEntry('42').text).toBe('42');
});
