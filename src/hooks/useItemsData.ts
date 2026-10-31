import { useCallback, useState } from 'react';

import { itemApi, typeApi } from '@/api/itemApi';
import type { ItemType } from '@/models/itemType';
import type { ItemWithType } from '@/models/item';

export function useItemsData() {
  const [items, setItems] = useState<ItemWithType[]>([]);
  const [types, setTypes] = useState<ItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [loadedItems, loadedTypes] = await Promise.all([
        itemApi.getItems(),
        typeApi.getItemTypes(),
      ]);
      setItems(loadedItems);
      setTypes(loadedTypes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load items');
    } finally {
      setLoading(false);
    }
  }, []);

  return { items, types, loading, error, refresh };
}

export function getTasks(items: ItemWithType[]) {
  return items.filter((item) => item.typeName === 'Task');
}

export function getNonTasks(items: ItemWithType[]) {
  return items.filter((item) => item.typeName !== 'Task');
}

