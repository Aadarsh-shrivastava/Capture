jest.mock('expo-sqlite', () => ({}));
jest.mock('@/vault', () => ({}));
jest.mock('./seed', () => ({}));

import {DB_VERSION} from './database';
import {MIGRATIONS} from './migrations';

// A new migration that DB_VERSION doesn't reach never runs (the column is missing and inserts fail).
test('DB_VERSION is the latest migration', () => {
  expect(DB_VERSION).toBe(Math.max(...Object.keys(MIGRATIONS).map(Number)));
});
