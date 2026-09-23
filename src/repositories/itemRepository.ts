import type { Behavior } from '@/models/behavior';
import type { ItemType } from '@/models/itemType';
import type { Item, ItemWithType, CreateItemInput, UpdateItemInput } from '@/models/item';
import { getDatabase } from '@/db/database';

type ItemRow = {
  id: number;
  type_id: number;
  title: string;
  content: string | null;
  importance: number | null;
  urgency: number | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type ItemWithTypeRow = ItemRow & {
  type_name: string;
};

type BehaviorRow = {
  id: number;
  name: string;
  description: string | null;
  is_system: number;
  created_at: string;
  updated_at: string;
};

type ItemTypeRow = {
  id: number;
  name: string;
  description: string | null;
  is_system: number;
  created_at: string;
  updated_at: string;
};

function mapItem(row: ItemRow): Item {
  return {
    id: row.id,
    typeId: row.type_id,
    title: row.title,
    content: row.content,
    importance: row.importance,
    urgency: row.urgency,
    status: row.status ?? 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapItemWithType(row: ItemWithTypeRow): ItemWithType {
  return {
    ...mapItem(row),
    typeName: row.type_name,
  };
}

function mapBehavior(row: BehaviorRow): Behavior {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isSystem: row.is_system === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

function mapItemType(row: ItemTypeRow): ItemType {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isSystem: row.is_system === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

export const itemRepository = {
  async create(input: CreateItemInput): Promise<Item> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const result = await db.runAsync(
      `INSERT INTO items (type_id, title, content, importance, urgency, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      input.typeId,
      input.title.trim(),
      input.content?.trim() || null,
      input.importance ?? null,
      input.urgency ?? null,
      input.status ?? 'active',
      now,
      now
    );

    const item = await this.findById(Number(result.lastInsertRowId));
    if (!item) {
      throw new Error('Failed to create item');
    }

    return item;
  },

  async findById(id: number): Promise<Item | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<ItemRow>('SELECT * FROM items WHERE id = ?', id);
    return row ? mapItem(row) : null;
  },

  async findByIdWithType(id: number): Promise<ItemWithType | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<ItemWithTypeRow>(
      `SELECT i.*, t.name AS type_name
       FROM items i
       INNER JOIN item_types t ON t.id = i.type_id
       WHERE i.id = ?`,
      id
    );

    return row ? mapItemWithType(row) : null;
  },

  async findAll(): Promise<ItemWithType[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ItemWithTypeRow>(
      `SELECT i.*, t.name AS type_name
       FROM items i
       INNER JOIN item_types t ON t.id = i.type_id
       ORDER BY i.created_at DESC`
    );

    return rows.map(mapItemWithType);
  },

  async findByTypeId(typeId: number): Promise<ItemWithType[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ItemWithTypeRow>(
      `SELECT i.*, t.name AS type_name
       FROM items i
       INNER JOIN item_types t ON t.id = i.type_id
       WHERE i.type_id = ?
       ORDER BY i.created_at DESC`,
      typeId
    );

    return rows.map(mapItemWithType);
  },

  async findCreatedOnDate(isoDatePrefix: string): Promise<ItemWithType[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ItemWithTypeRow>(
      `SELECT i.*, t.name AS type_name
       FROM items i
       INNER JOIN item_types t ON t.id = i.type_id
       WHERE i.created_at LIKE ?
       ORDER BY i.created_at DESC`,
      `${isoDatePrefix}%`
    );

    return rows.map(mapItemWithType);
  },

  async update(id: number, input: UpdateItemInput): Promise<Item> {
    const db = await getDatabase();
    const existing = await this.findById(id);

    if (!existing) {
      throw new Error('Item not found');
    }

    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE items
       SET type_id = ?, title = ?, content = ?, importance = ?, urgency = ?, status = ?, updated_at = ?
       WHERE id = ?`,
      input.typeId ?? existing.typeId,
      input.title?.trim() ?? existing.title,
      input.content !== undefined ? input.content?.trim() || null : existing.content,
      input.importance !== undefined ? input.importance : existing.importance,
      input.urgency !== undefined ? input.urgency : existing.urgency,
      input.status ?? existing.status,
      now,
      id
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Failed to update item');
    }

    return updated;
  },

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM items WHERE id = ?', id);
  },

  async getTypeDefaultBehaviors(typeId: number): Promise<Behavior[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<BehaviorRow>(
      `SELECT b.*
       FROM behaviors b
       INNER JOIN type_behaviors tb ON tb.behavior_id = b.id
       WHERE tb.type_id = ?
       ORDER BY b.name ASC`,
      typeId
    );

    return rows.map(mapBehavior);
  },

  async getItemExplicitBehaviors(itemId: number): Promise<Behavior[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<BehaviorRow>(
      `SELECT b.*
       FROM behaviors b
       INNER JOIN item_behaviors ib ON ib.behavior_id = b.id
       WHERE ib.item_id = ?
       ORDER BY b.name ASC`,
      itemId
    );

    return rows.map(mapBehavior);
  },

  async getEffectiveBehaviors(itemId: number): Promise<Behavior[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<BehaviorRow>(
      `SELECT DISTINCT b.*
       FROM behaviors b
       LEFT JOIN item_behaviors ib ON ib.behavior_id = b.id AND ib.item_id = ?
       LEFT JOIN items i ON i.id = ?
       LEFT JOIN type_behaviors tb ON tb.behavior_id = b.id AND tb.type_id = i.type_id
       WHERE ib.item_id IS NOT NULL OR tb.type_id IS NOT NULL
       ORDER BY b.name ASC`,
      itemId,
      itemId
    );

    return rows.map(mapBehavior);
  },

  async addBehaviorToItem(itemId: number, behaviorId: number): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT OR IGNORE INTO item_behaviors (item_id, behavior_id, created_at)
       VALUES (?, ?, ?)`,
      itemId,
      behaviorId,
      now
    );
  },

  async removeBehaviorFromItem(itemId: number, behaviorId: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'DELETE FROM item_behaviors WHERE item_id = ? AND behavior_id = ?',
      itemId,
      behaviorId
    );
  },
};

export const itemTypeRepository = {
  async findAll(): Promise<ItemType[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ItemTypeRow>(
      'SELECT * FROM item_types ORDER BY name ASC'
    );
    return rows.map(mapItemType);
  },

  async findById(id: number): Promise<ItemType | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<ItemTypeRow>(
      'SELECT * FROM item_types WHERE id = ?',
      id
    );
    return row ? mapItemType(row) : null;
  },

  async findByName(name: string): Promise<ItemType | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<ItemTypeRow>(
      'SELECT * FROM item_types WHERE name = ?',
      name
    );
    return row ? mapItemType(row) : null;
  },

  async getDefaultBehaviors(typeId: number): Promise<Behavior[]> {
    return itemRepository.getTypeDefaultBehaviors(typeId);
  },
};

export const behaviorRepository = {
  async findAll(): Promise<Behavior[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<BehaviorRow>(
      'SELECT * FROM behaviors ORDER BY name ASC'
    );
    return rows.map(mapBehavior);
  },

  async findById(id: number): Promise<Behavior | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<BehaviorRow>(
      'SELECT * FROM behaviors WHERE id = ?',
      id
    );
    return row ? mapBehavior(row) : null;
  },

  async findByName(name: string): Promise<Behavior | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<BehaviorRow>(
      'SELECT * FROM behaviors WHERE name = ?',
      name
    );
    return row ? mapBehavior(row) : null;
  },
};
