import {getDatabase} from '@/db/database';
import type {FocusTask} from '@/models/focusTask';
import {rolledDueAt} from '@/recurrence/utils';

type FocusTaskRow = {
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
  doable_status: string | null;
  due_at: string | null;
  completed_at: string | null;
  estimated_minutes: number | null;
  repeat_data: string | null;
};

function mapFocusTask(row: FocusTaskRow): FocusTask {
  return {
    id: row.id,
    typeId: row.type_id,
    title: row.title,
    content: row.content,
    importance: row.importance,
    mascot: row.mascot ?? null,
    unsure: Boolean(row.unsure),
    urgency: row.urgency,
    status: row.status ?? 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    typeName: row.type_name,
    doableStatus: row.doable_status ?? 'pending',
    dueAt: row.due_at,
    completedAt: row.completed_at,
    estimatedMinutes: row.estimated_minutes,
  };
}

export const focusRepository = {
  /** Active doable items of any type (Task or custom types with Doable) — excludes completed/cancelled. */
  async findActiveTasks(): Promise<FocusTask[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<FocusTaskRow>(
      `SELECT i.*, t.name AS type_name,
              d.status AS doable_status, d.due_at, d.completed_at, d.estimated_minutes, r.data AS repeat_data
       FROM items i
       INNER JOIN item_types t ON t.id = i.type_id
       INNER JOIN doable_items d ON d.item_id = i.id
       LEFT JOIN item_behavior_data r ON r.item_id = i.id AND r.behavior = 'Repeatable'
       WHERE d.status NOT IN ('completed', 'cancelled')
       ORDER BY i.updated_at DESC`,
    );

    // Missed repeats move to their next occurrence (saved), so they never carry over as overdue.
    for (const row of rows) {
      let data: Record<string, string> | null = null;
      try {
        data = row.repeat_data ? JSON.parse(row.repeat_data) : null;
      } catch {}
      const rolled = rolledDueAt(row.due_at, data);
      if (!rolled) continue;
      await db.runAsync('UPDATE doable_items SET due_at = ? WHERE item_id = ?', [rolled, row.id]);
      row.due_at = rolled;
    }
    return rows.map(mapFocusTask);
  },
};
