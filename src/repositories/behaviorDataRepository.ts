import { getBehaviorDefinition, getDefaultFieldValues } from '@/domain/behaviorDefinitions';
import { getDatabase } from '@/db/database';
import type { BehaviorDataMap } from '@/models/behaviorData';

function parseNumber(value: string | undefined): number | null {
  if (value === undefined || value.trim() === '') return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export const behaviorDataRepository = {
  async upsertForBehavior(behaviorName: string, itemId: number, data: Record<string, string>) {
    const def = getBehaviorDefinition(behaviorName);
    if (!def?.tableName) return;

    const db = await getDatabase();

    switch (behaviorName) {
      case 'Doable':
        await db.runAsync(
          `INSERT INTO doable_items (item_id, status, completed_at, due_at, estimated_minutes)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(item_id) DO UPDATE SET
             status = excluded.status,
             completed_at = excluded.completed_at,
             due_at = excluded.due_at,
             estimated_minutes = excluded.estimated_minutes`,
          itemId,
          data.status || 'pending',
          data.status === 'completed' ? new Date().toISOString() : null,
          data.due_at?.trim() || null,
          parseNumber(data.estimated_minutes)
        );
        break;
      case 'Memorable':
        await db.runAsync(
          `INSERT INTO memorable_items (item_id, review_at, last_reviewed_at)
           VALUES (?, ?, ?)
           ON CONFLICT(item_id) DO UPDATE SET
             review_at = excluded.review_at,
             last_reviewed_at = excluded.last_reviewed_at`,
          itemId,
          data.review_at?.trim() || null,
          data.last_reviewed_at?.trim() || null
        );
        break;
      case 'Visitable': {
        const url = data.url?.trim();
        if (!url) return;
        await db.runAsync(
          `INSERT INTO visitable_items (item_id, url, title, domain, last_visited_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(item_id) DO UPDATE SET
             url = excluded.url,
             title = excluded.title,
             domain = excluded.domain,
             last_visited_at = excluded.last_visited_at`,
          itemId,
          url,
          data.title?.trim() || null,
          extractDomain(url),
          data.last_visited_at?.trim() || null
        );
        break;
      }
      case 'Repeatable':
        await db.runAsync(
          `INSERT INTO repeatable_items (item_id, interval_value, interval_unit, next_occurrence_at, start_at, end_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(item_id) DO UPDATE SET
             interval_value = excluded.interval_value,
             interval_unit = excluded.interval_unit,
             next_occurrence_at = excluded.next_occurrence_at,
             start_at = excluded.start_at,
             end_at = excluded.end_at`,
          itemId,
          parseNumber(data.interval_value) ?? 1,
          data.interval_unit || 'week',
          data.next_occurrence_at?.trim() || null,
          data.start_at?.trim() || null,
          data.end_at?.trim() || null
        );
        break;
      case 'Trackable':
        await db.runAsync(
          `INSERT INTO trackable_items (item_id, current_value, target_value, unit)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(item_id) DO UPDATE SET
             current_value = excluded.current_value,
             target_value = excluded.target_value,
             unit = excluded.unit`,
          itemId,
          parseNumber(data.current_value),
          parseNumber(data.target_value),
          data.unit?.trim() || null
        );
        break;
      case 'Schedulable':
        await db.runAsync(
          `INSERT INTO schedulable_items (item_id, starts_at, ends_at, timezone)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(item_id) DO UPDATE SET
             starts_at = excluded.starts_at,
             ends_at = excluded.ends_at,
             timezone = excluded.timezone`,
          itemId,
          data.starts_at?.trim() || null,
          data.ends_at?.trim() || null,
          data.timezone?.trim() || null
        );
        break;
      default:
        break;
    }
  },

  async deleteForBehavior(behaviorName: string, itemId: number) {
    const def = getBehaviorDefinition(behaviorName);
    if (!def?.tableName) return;

    const db = await getDatabase();
    await db.runAsync(`DELETE FROM ${def.tableName} WHERE item_id = ?`, itemId);
  },

  async getForBehavior(behaviorName: string, itemId: number): Promise<Record<string, string>> {
    const db = await getDatabase();

    switch (behaviorName) {
      case 'Doable': {
        const row = await db.getFirstAsync<{
          status: string;
          completed_at: string | null;
          due_at: string | null;
          estimated_minutes: number | null;
        }>('SELECT * FROM doable_items WHERE item_id = ?', itemId);
        if (!row) return getDefaultFieldValues('Doable');
        return {
          status: row.status,
          completed_at: row.completed_at ?? '',
          due_at: row.due_at ?? '',
          estimated_minutes: row.estimated_minutes?.toString() ?? '',
        };
      }
      case 'Memorable': {
        const row = await db.getFirstAsync<{
          review_at: string | null;
          last_reviewed_at: string | null;
        }>('SELECT * FROM memorable_items WHERE item_id = ?', itemId);
        if (!row) return {};
        return {
          review_at: row.review_at ?? '',
          last_reviewed_at: row.last_reviewed_at ?? '',
        };
      }
      case 'Visitable': {
        const row = await db.getFirstAsync<{
          url: string;
          title: string | null;
          domain: string | null;
          last_visited_at: string | null;
        }>('SELECT * FROM visitable_items WHERE item_id = ?', itemId);
        if (!row) return {};
        return {
          url: row.url,
          title: row.title ?? '',
          domain: row.domain ?? '',
          last_visited_at: row.last_visited_at ?? '',
        };
      }
      case 'Repeatable': {
        const row = await db.getFirstAsync<{
          interval_value: number;
          interval_unit: string;
          next_occurrence_at: string | null;
          start_at: string | null;
          end_at: string | null;
        }>('SELECT * FROM repeatable_items WHERE item_id = ?', itemId);
        if (!row) return { interval_value: '1', interval_unit: 'week' };
        return {
          interval_value: row.interval_value.toString(),
          interval_unit: row.interval_unit,
          next_occurrence_at: row.next_occurrence_at ?? '',
          start_at: row.start_at ?? '',
          end_at: row.end_at ?? '',
        };
      }
      case 'Trackable': {
        const row = await db.getFirstAsync<{
          current_value: number | null;
          target_value: number | null;
          unit: string | null;
        }>('SELECT * FROM trackable_items WHERE item_id = ?', itemId);
        if (!row) return {};
        return {
          current_value: row.current_value?.toString() ?? '',
          target_value: row.target_value?.toString() ?? '',
          unit: row.unit ?? '',
        };
      }
      case 'Schedulable': {
        const row = await db.getFirstAsync<{
          starts_at: string | null;
          ends_at: string | null;
          timezone: string | null;
        }>('SELECT * FROM schedulable_items WHERE item_id = ?', itemId);
        if (!row) return {};
        return {
          starts_at: row.starts_at ?? '',
          ends_at: row.ends_at ?? '',
          timezone: row.timezone ?? '',
        };
      }
      default:
        return {};
    }
  },

  async loadAllForBehaviors(behaviorNames: string[], itemId: number): Promise<BehaviorDataMap> {
    const result: BehaviorDataMap = {};
    for (const name of behaviorNames) {
      if (getBehaviorDefinition(name)?.tableName) {
        result[name] = await this.getForBehavior(name, itemId);
      }
    }
    return result;
  },

  async upsertAllForBehaviors(behaviorNames: string[], itemId: number, data: BehaviorDataMap) {
    for (const name of behaviorNames) {
      if (getBehaviorDefinition(name)?.tableName) {
        await this.upsertForBehavior(name, itemId, data[name] ?? {});
      }
    }
  },

  async deleteAllForBehaviors(behaviorNames: string[], itemId: number) {
    for (const name of behaviorNames) {
      await this.deleteForBehavior(name, itemId);
    }
  },
};
