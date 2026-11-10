/**
 * The capture queue end to end, without the model: one dump must become exactly the items it holds —
 * never extra, never twice, never lost. The database is a small in-memory stand-in for capture_queue.
 */
import {analyzeText, splitCapture} from '@/hooks/useCaptureAnalysis';
import {ensureLoaded} from '@/hooks/useLlamaModel';
import {saveCaptures} from '@/services/saveCaptures';

import {drain, enqueue} from './queue';

type QueueRow = {id: number; text: string; group_name: string | null; created_at: string; attempts: number; needs_split: number; kind: string | null};

let rows: QueueRow[] = [];
let nextId = 1;

const mockDb = {
  async runAsync(sql: string, ...args: unknown[]) {
    if (sql.startsWith('INSERT INTO capture_queue')) {
      const [text, group_name, created_at, needs_split = 0, kind = null] = args as [string, string | null, string, number?, string?];
      rows.push({id: nextId++, text, group_name, created_at, attempts: 0, needs_split, kind});
    } else if (sql.startsWith('UPDATE capture_queue SET attempts')) {
      const row = rows.find(r => r.id === args[0]);
      if (row) row.attempts += 1;
    } else if (sql.startsWith('DELETE FROM capture_queue')) {
      rows = rows.filter(r => r.id !== args[0]);
    } else {
      throw new Error(`fake db: unexpected SQL ${sql}`);
    }
  },
  async getFirstAsync(sql: string, ...args: unknown[]) {
    if (sql.includes('COUNT(*)')) return {n: rows.length};
    return rows.filter(r => !args.includes(r.id)).sort((a, b) => a.id - b.id)[0] ?? null;
  },
  async withTransactionAsync(fn: () => Promise<void>) {
    await fn();
  },
};

jest.mock('@/db/database', () => ({getDatabase: async () => mockDb}));
jest.mock('@/hooks/useLlamaModel', () => ({ensureLoaded: jest.fn()}));
jest.mock('@/hooks/useCaptureAnalysis', () => {
  class ModelUnavailableError extends Error {}
  return {ModelUnavailableError, analyzeText: jest.fn(), splitCapture: jest.fn()};
});
jest.mock('@/selectiveKnowledge/agent', () => ({
  rawThought: (text: string) => ({typeName: 'Note', title: text, content: text}),
}));
jest.mock('@/services/saveCaptures', () => ({
  saveCaptures: jest.fn(async (drafts: {title: string}[]) => drafts.map((d, i) => ({id: i, title: d.title, draft: d}))),
  announceSaved: jest.fn(),
}));

const savedTitles = () => (saveCaptures as jest.Mock).mock.calls.flatMap(([drafts]) => drafts.map((d: {title: string}) => d.title));
const tick = () => new Promise<void>(r => setTimeout(r, 5));

/** Let every queued drain (and its reruns) finish. */
async function settle() {
  for (let i = 0; i < 50; i++) await tick();
}

beforeEach(() => {
  rows = [];
  nextId = 1;
  jest.clearAllMocks();
  (ensureLoaded as jest.Mock).mockResolvedValue(true);
  (splitCapture as jest.Mock).mockImplementation(async (text: string) => [text]);
  (analyzeText as jest.Mock).mockImplementation(async (text: string) => ({typeName: 'Task', title: text}));
});

test('a dump of three thoughts becomes exactly three items', async () => {
  (splitCapture as jest.Mock).mockResolvedValue(['buy milk', 'call mom', 'book dentist']);
  await enqueue(['buy milk, call mom and book the dentist'], undefined, true);
  await settle();
  expect(savedTitles()).toEqual(['buy milk', 'call mom', 'book dentist']);
  expect(rows).toEqual([]);
});

test('running the queue several times at once saves each thought once', async () => {
  (analyzeText as jest.Mock).mockImplementation(async (text: string) => {
    await tick();
    return {typeName: 'Task', title: text};
  });
  await enqueue(['gym tomorrow']);
  await Promise.all([drain(), drain(), drain()]);
  await settle();
  expect(savedTitles()).toEqual(['gym tomorrow']);
});

test('a thought captured while the queue is busy is saved once', async () => {
  (analyzeText as jest.Mock).mockImplementation(async (text: string) => {
    await tick();
    return {typeName: 'Task', title: text};
  });
  await enqueue(['first']);
  await enqueue(['second']);
  await settle();
  expect(savedTitles()).toEqual(['first', 'second']);
});

test('a dump split twice (two drains racing on the same row) does not double its items', async () => {
  (splitCapture as jest.Mock).mockImplementation(async () => {
    await tick();
    return ['a', 'b'];
  });
  await enqueue(['a and b'], undefined, true);
  await Promise.all([drain(), drain()]);
  await settle();
  expect(savedTitles()).toEqual(['a', 'b']);
});

test('a thought the model fails on does not block the others, and is kept for later', async () => {
  (analyzeText as jest.Mock).mockImplementation(async (text: string) => {
    if (text === 'bad') throw new Error('model returned no type');
    return {typeName: 'Task', title: text};
  });
  await enqueue(['bad', 'good']);
  await settle();
  expect(savedTitles()).toEqual(['good']);
  expect(rows.map(r => r.text)).toEqual(['bad']);
});

test('after two failed tries, the thought is saved exactly as said (not lost, not retried forever)', async () => {
  (analyzeText as jest.Mock).mockRejectedValue(new Error('model returned no type'));
  await enqueue(['weird thought']);
  await settle();
  await drain();
  await settle();
  await drain();
  await settle();
  expect(savedTitles()).toEqual(['weird thought']);
  expect(rows).toEqual([]);
});

test('no model: nothing is saved and nothing is lost', async () => {
  (ensureLoaded as jest.Mock).mockResolvedValue(false);
  await enqueue(['call mom'], undefined, true);
  await settle();
  expect(savedTitles()).toEqual([]);
  expect(rows.map(r => r.text)).toEqual(['call mom']);
});

test('relative dates use the time the thought was captured, not when it is processed', async () => {
  const said = new Date(2026, 9, 30, 23, 0);
  await enqueue([{text: 'gym tomorrow', at: said}]);
  await settle();
  expect((analyzeText as jest.Mock).mock.calls[0][2]).toEqual(said);
});

test('a shared item is kept whole and carries your pick to the agent', async () => {
  const article = 'read this weekend\ngreat article. it has many sentences, and also commas https://x.io';
  await enqueue([{text: article, at: new Date(2026, 10, 9), split: false, kind: 'read'}]);
  await settle();
  expect(splitCapture).not.toHaveBeenCalled();
  expect((analyzeText as jest.Mock).mock.calls[0]).toEqual([article, undefined, new Date(2026, 10, 9), 'read']);
});
