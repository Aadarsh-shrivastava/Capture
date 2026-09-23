import {getDatabase} from '@/db/database';
import type {FocusTask} from '@/models/focusTask';

type FocusTaskRow = {
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
  doable_status: string | null;
  due_at: string | null;
  completed_at: string | null;
  estimated_minutes: number | null;
};

function mapFocusTask(row: FocusTaskRow): FocusTask {
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
    typeName: row.type_name,
    doableStatus: row.doable_status ?? 'pending',
    dueAt: row.due_at,
    completedAt: row.completed_at,
    estimatedMinutes: row.estimated_minutes,
  };
}

export const focusRepository = {
  /** Active tasks with doable data — excludes completed/cancelled. */
  async findActiveTasks(): Promise<FocusTask[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<FocusTaskRow>(
      `SELECT i.*, t.name AS type_name,
              d.status AS doable_status, d.due_at, d.completed_at, d.estimated_minutes
       FROM items i
       INNER JOIN item_types t ON t.id = i.type_id
       LEFT JOIN doable_items d ON d.item_id = i.id
       WHERE t.name = 'Task'
         AND (d.status IS NULL OR d.status NOT IN ('completed', 'cancelled'))
       ORDER BY i.updated_at DESC`,
    );

    return rows.map(mapFocusTask);
  },
};
