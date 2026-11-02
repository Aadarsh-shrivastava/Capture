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

/** Behaviors with fields but no dedicated table live as JSON in item_behavior_data. */
function isJsonBehavior(name: string): boolean {
  const def = getBehaviorDefinition(name);
  return Boolean(def && !def.tableName && def.fields.length > 0);
}

function hasData(name: string): boolean {
  return Boolean(getBehaviorDefinition(name)?.tableName) || isJsonBehavior(name);
}

export const behaviorDataRepository = {
  async upsertForBehavior(behaviorName: string, itemId: number, data: Record<string, string>) {
    const def = getBehaviorDefinition(behaviorName);
    if (!def) return;
    const db = await getDatabase();

    if (isJsonBehavior(behaviorName)) {
      // Keep only defined fields so stray keys never pile up.
      const clean = Object.fromEntries(def.fields.map((f) => [f.name, data[f.name] ?? '']));
      await db.runAsync(
        `INSERT INTO item_behavior_data (item_id, behavior, data, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(item_id, behavior) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
        itemId,
        behaviorName,
        JSON.stringify(clean),
        new Date().toISOString()
      );
      return;
    }
    if (!def.tableName) return;

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
          `INSERT INTO memorable_items (item_id, review_at, last_reviewed_at, weight, interval_days, times_shown)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(item_id) DO UPDATE SET
             review_at = excluded.review_at,
             last_reviewed_at = excluded.last_reviewed_at,
             weight = excluded.weight,
             interval_days = excluded.interval_days,
             times_shown = excluded.times_shown`,
          itemId,
          data.review_at?.trim() || null,
          data.last_reviewed_at?.trim() || null,
          parseNumber(data.weight),
          parseNumber(data.interval_days),
          parseNumber(data.times_shown) ?? 0
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
    const db = await getDatabase();
    if (isJsonBehavior(behaviorName)) {
      await db.runAsync('DELETE FROM item_behavior_data WHERE item_id = ? AND behavior = ?', itemId, behaviorName);
      return;
    }
    if (!def?.tableName) return;
    await db.runAsync(`DELETE FROM ${def.tableName} WHERE item_id = ?`, itemId);
  },

  async getForBehavior(behaviorName: string, itemId: number): Promise<Record<string, string>> {
    const db = await getDatabase();

    if (isJsonBehavior(behaviorName)) {
      const row = await db.getFirstAsync<{ data: string }>(
        'SELECT data FROM item_behavior_data WHERE item_id = ? AND behavior = ?',
        itemId,
        behaviorName
      );
      return { ...getDefaultFieldValues(behaviorName), ...(row ? (JSON.parse(row.data) as Record<string, string>) : {}) };
    }

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
          weight: number | null;
          interval_days: number | null;
          times_shown: number;
        }>('SELECT * FROM memorable_items WHERE item_id = ?', itemId);
        if (!row) return {};
        return {
          review_at: row.review_at ?? '',
          last_reviewed_at: row.last_reviewed_at ?? '',
          weight: row.weight?.toString() ?? '',
          interval_days: row.interval_days?.toString() ?? '',
          times_shown: String(row.times_shown ?? 0),
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
      if (hasData(name)) {
        result[name] = await this.getForBehavior(name, itemId);
      }
    }
    return result;
  },

  async upsertAllForBehaviors(behaviorNames: string[], itemId: number, data: BehaviorDataMap) {
    for (const name of behaviorNames) {
      if (hasData(name)) {
        await this.upsertForBehavior(name, itemId, data[name] ?? {});
      }
    }
  },

  /** All rows of one JSON behavior: item id → data (for jobs like reminders). */
  /** Ids of items that hold a link (Visitable lives in its own table). */
  async linkedItemIds(): Promise<Set<number>> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ item_id: number }>('SELECT item_id FROM visitable_items');
    return new Set(rows.map((r) => r.item_id));
  },

  async allForBehavior(behaviorName: string): Promise<Map<number, Record<string, string>>> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ item_id: number; data: string }>(
      'SELECT item_id, data FROM item_behavior_data WHERE behavior = ?',
      behaviorName
    );
    return new Map(rows.map((r) => [r.item_id, JSON.parse(r.data) as Record<string, string>]));
  },

  async deleteAllForBehaviors(behaviorNames: string[], itemId: number) {
    for (const name of behaviorNames) {
      await this.deleteForBehavior(name, itemId);
    }
  },
};
