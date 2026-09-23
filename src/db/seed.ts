import type { SQLiteDatabase } from 'expo-sqlite';

type SeedType = { name: string; description: string };
type SeedBehavior = { name: string; description: string };
type SeedMapping = { typeName: string; behaviorName: string };

const TYPES: SeedType[] = [
  { name: 'Task', description: 'Something to do' },
  { name: 'Note', description: 'Something to reference' },
  { name: 'Journal', description: 'Personal reflection' },
  { name: 'Idea', description: 'Something to capture without committing to action' },
];

const BEHAVIORS: SeedBehavior[] = [
  { name: 'Doable', description: 'Can be completed' },
  { name: 'Notable', description: 'Can be noted and referenced' },
  { name: 'Memorable', description: 'Worth remembering over time' },
  { name: 'Visitable', description: 'Points to an external link' },
  { name: 'Repeatable', description: 'Can repeat on a schedule' },
  { name: 'Trackable', description: 'Has measurable progress' },
  { name: 'Schedulable', description: 'Associated with a time period' },
];

const TYPE_BEHAVIOR_MAPPINGS: SeedMapping[] = [
  { typeName: 'Task', behaviorName: 'Doable' },
  { typeName: 'Note', behaviorName: 'Notable' },
  { typeName: 'Journal', behaviorName: 'Notable' },
  { typeName: 'Journal', behaviorName: 'Memorable' },
  { typeName: 'Idea', behaviorName: 'Notable' },
];

async function upsertType(db: SQLiteDatabase, type: SeedType, now: string) {
  await db.runAsync(
    `INSERT INTO item_types (name, description, is_system, created_at, updated_at)
     VALUES (?, ?, 1, ?, ?)
     ON CONFLICT(name) DO UPDATE SET
       description = excluded.description,
       is_system = 1,
       updated_at = excluded.updated_at`,
    type.name,
    type.description,
    now,
    now
  );
}

async function upsertBehavior(db: SQLiteDatabase, behavior: SeedBehavior, now: string) {
  await db.runAsync(
    `INSERT INTO behaviors (name, description, is_system, created_at, updated_at)
     VALUES (?, ?, 1, ?, ?)
     ON CONFLICT(name) DO UPDATE SET
       description = excluded.description,
       is_system = 1,
       updated_at = excluded.updated_at`,
    behavior.name,
    behavior.description,
    now,
    now
  );
}

async function upsertMapping(db: SQLiteDatabase, mapping: SeedMapping) {
  await db.runAsync(
    `INSERT OR IGNORE INTO type_behaviors (type_id, behavior_id)
     SELECT t.id, b.id
     FROM item_types t, behaviors b
     WHERE t.name = ? AND b.name = ?`,
    mapping.typeName,
    mapping.behaviorName
  );
}

export async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    for (const type of TYPES) {
      await upsertType(db, type, now);
    }

    for (const behavior of BEHAVIORS) {
      await upsertBehavior(db, behavior, now);
    }

    for (const mapping of TYPE_BEHAVIOR_MAPPINGS) {
      await upsertMapping(db, mapping);
    }
  });
}
