import {getDatabase} from '@/db/database';
import type {ItemWithType} from '@/models/item';

type Row = {
  id: number;
  type_id: number;
  title: string;
  content: string | null;
  importance: number | null;
  mascot?: string | null;
  unsure?: number;
  urgency: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  type_name: string;
};

/** Items whose title, content, tag or group name contains the query. */
export const searchRepository = {
  async search(query: string): Promise<ItemWithType[]> {
    const db = await getDatabase();
    const like = `%${query.trim()}%`;
    const rows = await db.getAllAsync<Row>(
      `SELECT DISTINCT i.*, t.name AS type_name
       FROM items i
       INNER JOIN item_types t ON t.id = i.type_id
       LEFT JOIN item_tags it ON it.item_id = i.id
       LEFT JOIN tags tg ON tg.id = it.tag_id
       LEFT JOIN item_groups ig ON ig.item_id = i.id
       LEFT JOIN groups g ON g.id = ig.group_id
       WHERE i.title LIKE ? OR i.content LIKE ? OR tg.name LIKE ? OR g.name LIKE ?
       ORDER BY i.updated_at DESC
       LIMIT 100`,
      like, like, like, like,
    );
    return rows.map(r => ({
      id: r.id,
      typeId: r.type_id,
      title: r.title,
      content: r.content,
      importance: r.importance,
    mascot: r.mascot ?? null,
    unsure: Boolean(r.unsure),
      urgency: r.urgency,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      typeName: r.type_name,
    }));
  },
};
