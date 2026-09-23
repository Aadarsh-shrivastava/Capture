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

export function countByType(items: ItemWithType[], typeName: string) {
  return items.filter((item) => item.typeName === typeName).length;
}

export function getTasks(items: ItemWithType[]) {
  return items.filter((item) => item.typeName === 'Task');
}

export function getNonTasks(items: ItemWithType[]) {
  return items.filter((item) => item.typeName !== 'Task');
}

export function buildActivityMap(items: ItemWithType[], weeks = 5) {
  const map = new Map<string, number>();
  const today = new Date();

  for (let w = 0; w < weeks; w += 1) {
    for (let d = 0; d < 7; d += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - (weeks - 1 - w) * 7 - (6 - d));
      const key = date.toISOString().slice(0, 10);
      map.set(key, 0);
    }
  }

  for (const item of items) {
    const key = item.createdAt.slice(0, 10);
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }

  return map;
}
