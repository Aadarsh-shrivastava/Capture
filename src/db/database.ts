import * as SQLite from 'expo-sqlite';

import { runMigrations } from './migrations';
import { seedDatabase } from './seed';

let database: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!database) {
    database = await SQLite.openDatabaseAsync('lockedin.db');
    await database.execAsync('PRAGMA foreign_keys = ON;');
  }

  return database;
}

export async function initializeDatabase(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const db = await getDatabase();
    await runMigrations(db);
    await seedDatabase(db);
  })();

  return initPromise;
}

export const DB_VERSION = 3;
