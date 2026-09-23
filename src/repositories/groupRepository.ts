import { getDatabase } from '@/db/database';
import type { CreateGroupInput, Group, GroupWithCount, UpdateGroupInput } from '@/models/group';
import type { ItemWithType } from '@/models/item';

type GroupRow = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type GroupWithCountRow = GroupRow & {
  item_count: number;
};

function mapGroup(row: GroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const groupRepository = {
  async create(input: CreateGroupInput): Promise<Group> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const result = await db.runAsync(
      `INSERT INTO groups (name, description, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
      input.name.trim(),
      input.description?.trim() || null,
      now,
      now
    );

    const group = await this.findById(Number(result.lastInsertRowId));
    if (!group) {
      throw new Error('Failed to create group');
    }

    return group;
  },

  async findById(id: number): Promise<Group | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<GroupRow>('SELECT * FROM groups WHERE id = ?', id);
    return row ? mapGroup(row) : null;
  },

  async findAllWithCounts(): Promise<GroupWithCount[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<GroupWithCountRow>(
      `SELECT g.*, COUNT(ig.item_id) AS item_count
       FROM groups g
       LEFT JOIN item_groups ig ON ig.group_id = g.id
       GROUP BY g.id
       ORDER BY g.name ASC`
    );

    return rows.map((row) => ({
      ...mapGroup(row),
      itemCount: row.item_count,
    }));
  },

  async update(id: number, input: UpdateGroupInput): Promise<Group> {
    const db = await getDatabase();
    const existing = await this.findById(id);

    if (!existing) {
      throw new Error('Group not found');
    }

    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE groups
       SET name = ?, description = ?, updated_at = ?
       WHERE id = ?`,
      input.name?.trim() ?? existing.name,
      input.description !== undefined ? input.description?.trim() || null : existing.description,
      now,
      id
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Failed to update group');
    }

    return updated;
  },

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM groups WHERE id = ?', id);
  },

  async getItemsForGroup(groupId: number): Promise<ItemWithType[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: number;
      type_id: number;
      title: string;
      content: string | null;
      importance: number | null;
      urgency: number | null;
      status: string;
      created_at: string;
      updated_at: string;
      type_name: string;
    }>(
      `SELECT i.id, i.type_id, i.title, i.content, i.importance, i.urgency, i.status,
              i.created_at, i.updated_at, t.name AS type_name
       FROM items i
       INNER JOIN item_groups ig ON ig.item_id = i.id
       INNER JOIN item_types t ON t.id = i.type_id
       WHERE ig.group_id = ?
       ORDER BY i.created_at DESC`,
      groupId
    );

    return rows.map((row) => ({
      id: row.id,
      typeId: row.type_id,
      title: row.title,
      content: row.content,
      importance: row.importance,
      urgency: row.urgency,
      status: row.status ?? 'active',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      typeName: row.type_name,
    }));
  },

  async getGroupsForItem(itemId: number): Promise<Group[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<GroupRow>(
      `SELECT g.*
       FROM groups g
       INNER JOIN item_groups ig ON ig.group_id = g.id
       WHERE ig.item_id = ?
       ORDER BY g.name ASC`,
      itemId
    );

    return rows.map(mapGroup);
  },

  async setItemGroups(itemId: number, groupIds: number[]): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM item_groups WHERE item_id = ?', itemId);

      for (const groupId of groupIds) {
        await db.runAsync(
          'INSERT INTO item_groups (item_id, group_id, added_at) VALUES (?, ?, ?)',
          itemId,
          groupId,
          now
        );
      }
    });
  },
};
