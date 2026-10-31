import {useCallback, useEffect, useState} from 'react';

import type {Group} from '@/models/group';
import type {ItemWithType} from '@/models/item';
import {useDataVersionStore} from '@/store/dataVersionStore';
import {showUndo} from '@/undo';

import {groupsService} from './service';

export function useGroupPage(groupId: number) {
  const [group, setGroup] = useState<Group | null>(null);
  const [items, setItems] = useState<ItemWithType[]>([]);
  const [allItems, setAllItems] = useState<ItemWithType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const version = useDataVersionStore(state => state.version);

  const load = useCallback(async () => {
    try {
      setError(null);
      const page = await groupsService.loadPage(groupId);
      setGroup(page.group);
      setItems(page.items);
      setAllItems(page.allItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load group');
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load, version]);

  const add = useCallback((itemId: number) => groupsService.addItem(itemId, groupId), [groupId]);

  const remove = useCallback(
    async (item: ItemWithType) => {
      await groupsService.removeItem(item.id, groupId);
      showUndo(`Removed "${item.title}"`, () => groupsService.addItem(item.id, groupId));
    },
    [groupId],
  );

  const rename = useCallback(
    async (name: string, description: string) => {
      await groupsService.updateGroup(groupId, name, description);
      await load();
    },
    [groupId, load],
  );

  return {group, items, allItems, error, add, remove, rename};
}
