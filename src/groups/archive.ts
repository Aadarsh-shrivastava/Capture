import Storage from 'expo-sqlite/kv-store';

const KEY = 'groups.archived';

// ponytail: archive lives in kv (no schema change); move to a groups.archived_at column if groups sync anywhere.
export function archivedIds(): Set<number> {
  try {
    return new Set(JSON.parse(Storage.getItemSync(KEY) ?? '[]') as number[]);
  } catch {
    return new Set();
  }
}

export function setArchived(ids: number[], archived: boolean): void {
  const set = archivedIds();
  ids.forEach(id => (archived ? set.add(id) : set.delete(id)));
  Storage.setItemSync(KEY, JSON.stringify([...set]));
}
