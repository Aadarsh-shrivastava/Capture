import {getDatabase} from '@/db/database';
import {useDataVersionStore} from '@/store/dataVersionStore';

import {useItemTypesStore, type TypeInfo} from './store';

type Row = {id: number; name: string; description: string | null; icon: string | null; is_system: number; keywords: string};
type Link = {type_id: number; behavior: string; is_default: number};

/** Read all types with their default/optional behaviors into the registry. */
export async function loadItemTypes(): Promise<TypeInfo[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Row>('SELECT id, name, description, icon, is_system, keywords FROM item_types ORDER BY id');
  const links = await db.getAllAsync<Link>(
    `SELECT tb.type_id, b.name AS behavior, tb.is_default
     FROM type_behaviors tb INNER JOIN behaviors b ON b.id = tb.behavior_id`,
  );
  const types = rows.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    icon: r.icon,
    isSystem: r.is_system === 1,
    defaults: links.filter(l => l.type_id === r.id && l.is_default === 1).map(l => l.behavior),
    optional: links.filter(l => l.type_id === r.id && l.is_default === 0).map(l => l.behavior),
    keywords: parseKeywordList(r.keywords),
  }));
  useItemTypesStore.getState().setTypes(types);
  return types;
}

export type TypeInput = {
  id?: number;
  name: string;
  description: string;
  icon: string | null;
  defaults: string[];
  optional: string[];
  keywords: string[];
};

const MAX_KEYWORDS = 60;

function parseKeywordList(raw: string | null): string[] {
  try {
    const list = JSON.parse(raw ?? '[]');
    return Array.isArray(list) ? list.filter((w): w is string => typeof w === 'string') : [];
  } catch {
    return [];
  }
}

/** Lowercase, unique, capped — newest words kept when over the cap. */
export function normalizeKeywords(words: string[]): string[] {
  const clean = words.map(w => w.trim().toLowerCase()).filter(w => w.length >= 2);
  return [...new Set(clean)].slice(-MAX_KEYWORDS);
}

async function writeKeywords(typeId: number, keywords: string[]): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE item_types SET keywords = ? WHERE id = ?', JSON.stringify(normalizeKeywords(keywords)), typeId);
}

/** Replace a type's keywords (auto-generated or edited), then refresh the registry. */
export async function setTypeKeywords(typeId: number, keywords: string[]): Promise<void> {
  await writeKeywords(typeId, keywords);
  await loadItemTypes();
}

/** Add words to a custom type (learned from corrections and tags). Built-ins are left alone. */
export async function learnTypeKeywords(typeName: string, words: string[]): Promise<void> {
  const type = useItemTypesStore.getState().types.find(t => t.name === typeName);
  if (!type || type.isSystem || words.length === 0) return;
  await setTypeKeywords(type.id, [...type.keywords, ...words]);
}

/** Create or update a type. Built-in types keep their default behaviors (only optional ones change). */
export async function saveItemType(input: TypeInput): Promise<number> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const existing = input.id ? useItemTypesStore.getState().types.find(t => t.id === input.id) : undefined;
  let typeId = input.id ?? 0;

  await db.withTransactionAsync(async () => {
    if (existing) {
      await db.runAsync(
        'UPDATE item_types SET name = ?, description = ?, icon = ?, keywords = ?, updated_at = ? WHERE id = ?',
        existing.isSystem ? existing.name : input.name.trim(),
        input.description.trim() || null,
        input.icon,
        JSON.stringify(normalizeKeywords(input.keywords)),
        now,
        typeId,
      );
    } else {
      const res = await db.runAsync(
        'INSERT INTO item_types (name, description, icon, keywords, is_system, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)',
        input.name.trim(),
        input.description.trim() || null,
        input.icon,
        JSON.stringify(normalizeKeywords(input.keywords)),
        now,
        now,
      );
      typeId = Number(res.lastInsertRowId);
    }

    const defaults = existing?.isSystem ? existing.defaults : input.defaults;
    const optional = input.optional.filter(b => !defaults.includes(b));
    await db.runAsync(
      existing?.isSystem ? 'DELETE FROM type_behaviors WHERE type_id = ? AND is_default = 0' : 'DELETE FROM type_behaviors WHERE type_id = ?',
      typeId,
    );
    const rows = [...(existing?.isSystem ? [] : defaults.map(b => [b, 1] as const)), ...optional.map(b => [b, 0] as const)];
    for (const [behavior, isDefault] of rows) {
      await db.runAsync(
        `INSERT OR REPLACE INTO type_behaviors (type_id, behavior_id, is_default)
         SELECT ?, id, ? FROM behaviors WHERE name = ?`,
        typeId,
        isDefault,
        behavior,
      );
    }
  });

  await loadItemTypes();
  useDataVersionStore.getState().bump();
  return typeId;
}

export async function countItemsOfType(typeId: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{n: number}>('SELECT COUNT(*) AS n FROM items WHERE type_id = ?', typeId);
  return row?.n ?? 0;
}

/** Delete a custom type; its items move to `moveToTypeId` first. */
export async function deleteItemType(typeId: number, moveToTypeId: number): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE items SET type_id = ? WHERE type_id = ?', moveToTypeId, typeId);
    await db.runAsync('DELETE FROM item_types WHERE id = ? AND is_system = 0', typeId);
  });
  await loadItemTypes();
  useDataVersionStore.getState().bump();
}
