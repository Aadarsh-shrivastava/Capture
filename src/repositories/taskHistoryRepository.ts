import {getDatabase} from '@/db/database';

export type TaskHistoryRow = {
  id: number;
  title: string;
  status: string;
  dueAt: string | null;
  completedAt: string | null;
};

/** Every task with its Doable state — for progress and reviews (filtered in JS: due_at formats vary). */
export const taskHistoryRepository = {
  async findAll(): Promise<TaskHistoryRow[]> {
    const db = await getDatabase();
    return db.getAllAsync<TaskHistoryRow>(
      `SELECT i.id, i.title, d.status, d.due_at AS dueAt, d.completed_at AS completedAt
       FROM items i
       INNER JOIN doable_items d ON d.item_id = i.id`,
    );
  },
};
