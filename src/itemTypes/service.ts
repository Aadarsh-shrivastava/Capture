import {getDatabase} from '@/db/database';
import {useDataVersionStore} from '@/store/dataVersionStore';

import {useItemTypesStore, type TypeInfo} from './store';

type Row = {id: number; name: string; description: string | null; icon: string | null; is_system: number};
type Link = {type_id: number; behavior: string; is_default: number};

/** Read all types with their default/optional behaviors into the registry. */
export async function loadItemTypes(): Promise<TypeInfo[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Row>('SELECT id, name, description, icon, is_system FROM item_types ORDER BY id');
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
};

/** Create or update a type. Built-in types keep their default behaviors (only optional ones change). */
export async function saveItemType(input: TypeInput): Promise<number> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const existing = input.id ? useItemTypesStore.getState().types.find(t => t.id === input.id) : undefined;
  let typeId = input.id ?? 0;

  await db.withTransactionAsync(async () => {
    if (existing) {
      await db.runAsync(
        'UPDATE item_types SET name = ?, description = ?, icon = ?, updated_at = ? WHERE id = ?',
        existing.isSystem ? existing.name : input.name.trim(),
        input.description.trim() || null,
        input.icon,
        now,
        typeId,
      );
    } else {
      const res = await db.runAsync(
        'INSERT INTO item_types (name, description, icon, is_system, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
        input.name.trim(),
        input.description.trim() || null,
        input.icon,
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
