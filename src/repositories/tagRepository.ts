import { getDatabase } from '@/db/database';
import type { Tag } from '@/models/tag';

type TagRow = { id: number; name: string; created_at: string };

function mapTag(row: TagRow): Tag {
  return { id: row.id, name: row.name, createdAt: row.created_at };
}

function normalizeTagName(name: string) {
  return name.trim().toLowerCase().replace(/^#/, '');
}

export const tagRepository = {
  async findAll(): Promise<Tag[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<TagRow>('SELECT * FROM tags ORDER BY name ASC');
    return rows.map(mapTag);
  },

  async findOrCreate(name: string): Promise<Tag> {
    const db = await getDatabase();
    const normalized = normalizeTagName(name);
    if (!normalized) throw new Error('Tag name is required');

    const existing = await db.getFirstAsync<TagRow>(
      'SELECT * FROM tags WHERE name = ? COLLATE NOCASE',
      normalized
    );
    if (existing) return mapTag(existing);

    const now = new Date().toISOString();
    const result = await db.runAsync(
      'INSERT INTO tags (name, created_at) VALUES (?, ?)',
      normalized,
      now
    );

    const created = await db.getFirstAsync<TagRow>(
      'SELECT * FROM tags WHERE id = ?',
      Number(result.lastInsertRowId)
    );
    if (!created) throw new Error('Failed to create tag');
    return mapTag(created);
  },

  async getTagsForItem(itemId: number): Promise<Tag[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<TagRow>(
      `SELECT t.*
       FROM tags t
       INNER JOIN item_tags it ON it.tag_id = t.id
       WHERE it.item_id = ?
       ORDER BY t.name ASC`,
      itemId
    );
    return rows.map(mapTag);
  },

  async setItemTags(itemId: number, tagNames: string[]) {
    const db = await getDatabase();
    const normalized = [...new Set(tagNames.map(normalizeTagName).filter(Boolean))];

    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM item_tags WHERE item_id = ?', itemId);

      for (const name of normalized) {
        const tag = await this.findOrCreate(name);
        await db.runAsync(
          'INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)',
          itemId,
          tag.id
        );
      }
    });
  },
};
