import { getDatabase } from '@/db/database';
import type { SaveItemPayload, ItemFull } from '@/models/behaviorData';
import { behaviorDataRepository } from '@/repositories/behaviorDataRepository';
import { groupRepository } from '@/repositories/groupRepository';
import {
  behaviorRepository,
  itemRepository,
  itemTypeRepository,
} from '@/repositories/itemRepository';
import { tagRepository } from '@/repositories/tagRepository';

function normalizeTagName(name: string) {
  return name.trim().toLowerCase().replace(/^#/, '');
}

async function getEffectiveBehaviorNames(typeId: number, optionalBehaviorIds: number[]) {
  const defaults = await itemTypeRepository.getDefaultBehaviors(typeId);
  const defaultIds = new Set(defaults.map((b) => b.id));
  const optionalIds = optionalBehaviorIds.filter((id) => !defaultIds.has(id));

  const names = new Set<string>(defaults.map((b) => b.name));
  for (const id of optionalIds) {
    const behavior = await behaviorRepository.findById(id);
    if (behavior) names.add(behavior.name);
  }

  return { names: Array.from(names), optionalIds };
}

async function replaceItemGroups(itemId: number, groupIds: number[]) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync('DELETE FROM item_groups WHERE item_id = ?', itemId);
  for (const groupId of groupIds) {
    await db.runAsync(
      'INSERT OR IGNORE INTO item_groups (item_id, group_id, added_at) VALUES (?, ?, ?)',
      itemId,
      groupId,
      now
    );
  }
}

async function replaceItemTags(itemId: number, tagNames: string[]) {
  const db = await getDatabase();
  const normalized = [...new Set(tagNames.map(normalizeTagName).filter(Boolean))];
  await db.runAsync('DELETE FROM item_tags WHERE item_id = ?', itemId);

  for (const name of normalized) {
    const tag = await tagRepository.findOrCreate(name);
    await db.runAsync(
      'INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)',
      itemId,
      tag.id
    );
  }
}

export const itemSaveRepository = {
  async createComplete(payload: SaveItemPayload): Promise<number> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const { names, optionalIds } = await getEffectiveBehaviorNames(
      payload.typeId,
      payload.optionalBehaviorIds
    );

    let itemId = 0;

    await db.withTransactionAsync(async () => {
      const result = await db.runAsync(
        `INSERT INTO items (type_id, title, content, importance, urgency, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        payload.typeId,
        payload.title.trim(),
        payload.content?.trim() || null,
        payload.importance ?? null,
        payload.urgency ?? null,
        payload.status ?? 'active',
        now,
        now
      );
      itemId = Number(result.lastInsertRowId);

      for (const behaviorId of optionalIds) {
        await db.runAsync(
          `INSERT OR IGNORE INTO item_behaviors (item_id, behavior_id, created_at) VALUES (?, ?, ?)`,
          itemId,
          behaviorId,
          now
        );
      }

      for (const name of names) {
        await behaviorDataRepository.upsertForBehavior(name, itemId, payload.behaviorData[name] ?? {});
      }

      await replaceItemGroups(itemId, payload.groupIds);
      await replaceItemTags(itemId, payload.tagNames);
    });

    return itemId;
  },

  async updateComplete(itemId: number, payload: SaveItemPayload): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const existingOptional = await itemRepository.getItemExplicitBehaviors(itemId);
    const { names, optionalIds } = await getEffectiveBehaviorNames(
      payload.typeId,
      payload.optionalBehaviorIds
    );

    const removedOptional = existingOptional.filter((b) => !optionalIds.includes(b.id));
    const previousNames = (await itemRepository.getEffectiveBehaviors(itemId)).map((b) => b.name);
    const staleNames = previousNames.filter((n) => !names.includes(n));

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE items
         SET type_id = ?, title = ?, content = ?, importance = ?, urgency = ?, status = ?, updated_at = ?
         WHERE id = ?`,
        payload.typeId,
        payload.title.trim(),
        payload.content?.trim() || null,
        payload.importance ?? null,
        payload.urgency ?? null,
        payload.status ?? 'active',
        now,
        itemId
      );

      await db.runAsync('DELETE FROM item_behaviors WHERE item_id = ?', itemId);

      for (const behaviorId of optionalIds) {
        await db.runAsync(
          `INSERT OR IGNORE INTO item_behaviors (item_id, behavior_id, created_at) VALUES (?, ?, ?)`,
          itemId,
          behaviorId,
          now
        );
      }

      for (const behavior of removedOptional) {
        await behaviorDataRepository.deleteForBehavior(behavior.name, itemId);
      }

      for (const name of staleNames) {
        await behaviorDataRepository.deleteForBehavior(name, itemId);
      }

      for (const name of names) {
        await behaviorDataRepository.upsertForBehavior(name, itemId, payload.behaviorData[name] ?? {});
      }

      await replaceItemGroups(itemId, payload.groupIds);
      await replaceItemTags(itemId, payload.tagNames);
    });
  },

  async loadFull(itemId: number): Promise<ItemFull | null> {
    const item = await itemRepository.findByIdWithType(itemId);
    if (!item) return null;

    const defaults = await itemRepository.getTypeDefaultBehaviors(item.typeId);
    const optional = await itemRepository.getItemExplicitBehaviors(itemId);
    const effective = await itemRepository.getEffectiveBehaviors(itemId);
    const behaviorData = await behaviorDataRepository.loadAllForBehaviors(
      effective.map((b) => b.name),
      itemId
    );
    const groups = await groupRepository.getGroupsForItem(itemId);
    const tags = await tagRepository.getTagsForItem(itemId);

    return {
      id: item.id,
      typeId: item.typeId,
      typeName: item.typeName,
      title: item.title,
      content: item.content,
      importance: item.importance,
      urgency: item.urgency,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      defaultBehaviorIds: defaults.map((b) => b.id),
      optionalBehaviorIds: optional.map((b) => b.id),
      effectiveBehaviors: effective.map((b) => ({ id: b.id, name: b.name })),
      behaviorData,
      groupIds: groups.map((g) => g.id),
      tagNames: tags.map((t) => t.name),
    };
  },
};
