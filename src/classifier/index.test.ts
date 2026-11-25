import {classifyText, learn} from './index';

const table: {text: string; label: string}[] = [];
jest.mock('@/db/database', () => ({
  getDatabase: async () => ({
    getAllAsync: async () => table,
    runAsync: async (_sql: string, text: string, label: string) => {
      const i = table.findIndex(r => r.text === text);
      if (i >= 0) table.splice(i, 1);
      table.push({text, label});
    },
  }),
}));

test("a correction teaches the classifier the user's words", async () => {
  expect((await classifyText('buy eggs and bread')).label).toBe('Task'); // a bundled example
  await learn('buy eggs and bread', 'Journal');
  expect((await classifyText('buy eggs and bread')).label).toBe('Journal');
  await learn('buy eggs and bread', 'Note'); // answered again: newest wins
  expect(table).toEqual([{text: 'buy eggs and bread', label: 'Note'}]);
});

test('custom types are not learned', async () => {
  await learn('practice scales', 'Music');
  expect(table.map(r => r.label)).not.toContain('Music');
});
