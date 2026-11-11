import type { SQLiteDatabase } from 'expo-sqlite';

import { DB_VERSION } from './database';

const MIGRATIONS: Record<number, string[]> = {
  1: [
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS item_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS behaviors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS type_behaviors (
      type_id INTEGER NOT NULL,
      behavior_id INTEGER NOT NULL,
      PRIMARY KEY (type_id, behavior_id),
      FOREIGN KEY (type_id) REFERENCES item_types(id) ON DELETE CASCADE,
      FOREIGN KEY (behavior_id) REFERENCES behaviors(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (type_id) REFERENCES item_types(id)
    );`,
    `CREATE TABLE IF NOT EXISTS item_behaviors (
      item_id INTEGER NOT NULL,
      behavior_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (item_id, behavior_id),
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY (behavior_id) REFERENCES behaviors(id) ON DELETE CASCADE
    );`,
  ],
  2: [
    `CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS item_groups (
      item_id INTEGER NOT NULL,
      group_id INTEGER NOT NULL,
      added_at TEXT NOT NULL,
      PRIMARY KEY (item_id, group_id),
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
    );`,
    `CREATE INDEX IF NOT EXISTS idx_item_groups_group_id ON item_groups(group_id);`,
  ],
  3: [
    `ALTER TABLE item_types ADD COLUMN is_system INTEGER NOT NULL DEFAULT 1;`,
    `ALTER TABLE item_types ADD COLUMN updated_at TEXT;`,
    `UPDATE item_types SET updated_at = created_at WHERE updated_at IS NULL;`,
    `ALTER TABLE behaviors ADD COLUMN is_system INTEGER NOT NULL DEFAULT 1;`,
    `ALTER TABLE behaviors ADD COLUMN updated_at TEXT;`,
    `UPDATE behaviors SET updated_at = created_at WHERE updated_at IS NULL;`,
    `ALTER TABLE items ADD COLUMN importance INTEGER;`,
    `ALTER TABLE items ADD COLUMN urgency INTEGER;`,
    `ALTER TABLE items ADD COLUMN status TEXT NOT NULL DEFAULT 'active';`,
    `CREATE TABLE IF NOT EXISTS doable_items (
      item_id INTEGER PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'pending',
      completed_at TEXT,
      due_at TEXT,
      estimated_minutes INTEGER,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS memorable_items (
      item_id INTEGER PRIMARY KEY,
      review_at TEXT,
      last_reviewed_at TEXT,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS visitable_items (
      item_id INTEGER PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT,
      domain TEXT,
      last_visited_at TEXT,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS repeatable_items (
      item_id INTEGER PRIMARY KEY,
      interval_value INTEGER NOT NULL DEFAULT 1,
      interval_unit TEXT NOT NULL DEFAULT 'week',
      next_occurrence_at TEXT,
      start_at TEXT,
      end_at TEXT,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS trackable_items (
      item_id INTEGER PRIMARY KEY,
      current_value REAL,
      target_value REAL,
      unit TEXT,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS schedulable_items (
      item_id INTEGER PRIMARY KEY,
      starts_at TEXT,
      ends_at TEXT,
      timezone TEXT,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      created_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS item_tags (
      item_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (item_id, tag_id),
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );`,
    `CREATE INDEX IF NOT EXISTS idx_item_behaviors_item_id ON item_behaviors(item_id);`,
    `CREATE INDEX IF NOT EXISTS idx_item_behaviors_behavior_id ON item_behaviors(behavior_id);`,
    `CREATE INDEX IF NOT EXISTS idx_type_behaviors_type_id ON type_behaviors(type_id);`,
    `CREATE INDEX IF NOT EXISTS idx_type_behaviors_behavior_id ON type_behaviors(behavior_id);`,
    `CREATE INDEX IF NOT EXISTS idx_item_tags_item_id ON item_tags(item_id);`,
    `CREATE INDEX IF NOT EXISTS idx_item_tags_tag_id ON item_tags(tag_id);`,
  ],
  // Generic per-item behavior data as JSON. New behaviors need no migration; only hot,
  // heavily queried behaviors (Doable) keep a dedicated table.
  4: [
    `CREATE TABLE IF NOT EXISTS item_behavior_data (
      item_id INTEGER NOT NULL,
      behavior TEXT NOT NULL,
      data TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL,
      PRIMARY KEY (item_id, behavior),
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );`,
    `INSERT OR IGNORE INTO item_behavior_data (item_id, behavior, data, updated_at)
     SELECT item_id, 'Repeatable',
            json_object('interval_value', CAST(interval_value AS TEXT), 'interval_unit', interval_unit),
            datetime('now')
     FROM repeatable_items;`,
  ],
  // Types become user-manageable: an icon per type, and type_behaviors rows can be optional (is_default = 0).
  5: [
    `ALTER TABLE item_types ADD COLUMN icon TEXT;`,
    `ALTER TABLE type_behaviors ADD COLUMN is_default INTEGER NOT NULL DEFAULT 1;`,
    `INSERT OR IGNORE INTO type_behaviors (type_id, behavior_id, is_default)
     SELECT t.id, b.id, 0 FROM item_types t, behaviors b
     WHERE (t.name = 'Task' AND b.name IN ('Schedulable','Repeatable','Trackable','Visitable','Divisible','Remindable'))
        OR (t.name = 'Note' AND b.name IN ('Visitable','Memorable'))
        OR (t.name IN ('Journal','Idea') AND b.name = 'Visitable');`,
  ],
  // Words that point to a type (generated once, edited by the user, learned from corrections).
  6: [`ALTER TABLE item_types ADD COLUMN keywords TEXT NOT NULL DEFAULT '[]';`],
  // "Come back": Memorable gets a weight (how often), its current gap, and a count. Ideas get it by default.
  7: [
    `ALTER TABLE memorable_items ADD COLUMN weight INTEGER;`,
    `ALTER TABLE memorable_items ADD COLUMN interval_days REAL;`,
    `ALTER TABLE memorable_items ADD COLUMN times_shown INTEGER NOT NULL DEFAULT 0;`,
    `INSERT OR IGNORE INTO type_behaviors (type_id, behavior_id, is_default)
     SELECT t.id, b.id, 1 FROM item_types t, behaviors b WHERE t.name = 'Idea' AND b.name = 'Memorable';`,
    `INSERT OR IGNORE INTO memorable_items (item_id)
     SELECT i.id FROM items i JOIN item_types t ON t.id = i.type_id WHERE t.name = 'Idea';`,
  ],
  // Say and forget: captured thoughts wait here until the model has turned them into items.
  8: [
    `CREATE TABLE IF NOT EXISTS capture_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      group_name TEXT,
      created_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0
    );`,
  ],
  // Thoughts from outside the app (widget, lock screen, Siri) are stored whole; the worker splits them.
  9: [`ALTER TABLE capture_queue ADD COLUMN needs_split INTEGER NOT NULL DEFAULT 0;`],
  // Which sticker an item shows (src/mascot/itemMascots.ts); picked by the capture model.
  10: [`ALTER TABLE items ADD COLUMN mascot TEXT;`],
  // The model guessed "to do" without the user's words saying so: Focus asks before trusting it.
  11: [`ALTER TABLE items ADD COLUMN unsure INTEGER NOT NULL DEFAULT 0;`],
  // What the user said it is when sharing (to do / read later / remember / just keep) — the model doesn't guess it.
  12: [`ALTER TABLE capture_queue ADD COLUMN kind TEXT;`],
};

async function getCurrentVersion(db: SQLiteDatabase): Promise<number> {
  const table = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'"
  );

  if (!table) {
    return 0;
  }

  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) AS version FROM schema_migrations'
  );

  return row?.version ?? 0;
}

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const currentVersion = await getCurrentVersion(db);

  for (let version = currentVersion + 1; version <= DB_VERSION; version += 1) {
    const statements = MIGRATIONS[version];
    if (!statements) {
      throw new Error(`Missing migration for version ${version}`);
    }

    await db.withTransactionAsync(async () => {
      for (const statement of statements) {
        await db.execAsync(statement);
      }

      await db.runAsync(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
        version,
        new Date().toISOString()
      );
    });
  }
}
