import type {ItemWithType} from '@/models/item';
import {ITEM_TYPE_ORDER} from '@/ui/itemTypeConfig';

/** Group page sections: items bucketed by type, in the app's type order, empty types dropped. */
export function sectionsByType(items: ItemWithType[]): {typeName: string; items: ItemWithType[]}[] {
  const order = [...ITEM_TYPE_ORDER, ...new Set(items.map(i => i.typeName))].filter(
    (name, index, all) => all.indexOf(name) === index,
  );
  return order
    .map(typeName => ({typeName, items: items.filter(i => i.typeName === typeName)}))
    .filter(section => section.items.length > 0);
}

/** Items not already in the group, filtered by a search query. */
export function addCandidates(all: ItemWithType[], inGroup: ItemWithType[], query: string): ItemWithType[] {
  const taken = new Set(inGroup.map(i => i.id));
  const q = query.trim().toLowerCase();
  return all.filter(i => !taken.has(i.id) && (!q || i.title.toLowerCase().includes(q)));
}

export function withGroup(groupIds: number[], groupId: number, on: boolean): number[] {
  const rest = groupIds.filter(id => id !== groupId);
  return on ? [...rest, groupId] : rest;
}
