import { useCallback, useEffect, useRef, useState } from 'react';

import { itemApi, typeApi } from '@/api/itemApi';
import type { ItemType } from '@/models/itemType';
import type { ItemWithType } from '@/models/item';
import { useDataVersionStore } from '@/store/dataVersionStore';

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

  // Reload after every save/delete too, not only on focus: a bulk delete hides its rows for the slide-out,
  // and they must be gone from the data by the time they'd show again.
  const version = useDataVersionStore((state) => state.version);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false; // the screen's own focus refresh does the first load
      return;
    }
    refresh();
  }, [version, refresh]);

  return { items, types, loading, error, refresh };
}

