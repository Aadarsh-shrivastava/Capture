import {groupApi} from '@/api/groupApi';
import {itemApi} from '@/api/itemApi';
import type {Group, GroupWithCount} from '@/models/group';
import type {SaveItemPayload} from '@/models/behaviorData';
import {useDataVersionStore} from '@/store/dataVersionStore';
import {deleteItemForUndo, restoreItem} from '@/taskActions';

import {archivedIds, setArchived} from './archive';

import {withGroup} from './utils';

const bump = () => useDataVersionStore.getState().bump();

/** What's needed to bring a deleted group back. */
type GroupSnapshot = {group: Group; memberIds: number[]; items: SaveItemPayload[]};

async function setMembership(itemId: number, groupId: number, on: boolean): Promise<void> {
  const current = await groupApi.getItemGroups(itemId);
  await groupApi.setItemGroups(itemId, withGroup(current.map(g => g.id), groupId, on));
  bump();
}

export const groupsService = {
  getGroups: () => groupApi.getGroups(),
  /** Groups minus archived ones — for Library, capture and the agent. */
  async getActiveGroups(): Promise<GroupWithCount[]> {
    const archived = archivedIds();
    return (await groupApi.getGroups()).filter(g => !archived.has(g.id));
  },
  archivedIds,
  setArchived(ids: number[], archived: boolean) {
    setArchived(ids, archived);
    bump();
  },

  /** Delete groups; with `withItems` their items go too. Returns snapshots for Undo. */
  async deleteGroups(groups: Group[], withItems: boolean): Promise<GroupSnapshot[]> {
    const snapshots: GroupSnapshot[] = [];
    for (const group of groups) {
      const members = await groupApi.getGroupItems(group.id);
      const items: SaveItemPayload[] = [];
      if (withItems) for (const m of members) items.push(await deleteItemForUndo(m.id));
      await groupApi.deleteGroup(group.id);
      snapshots.push({group, memberIds: withItems ? [] : members.map(m => m.id), items});
    }
    bump();
    return snapshots;
  },

  /** Recreate groups (new ids), then re-link kept items and restore deleted ones. */
  async restoreGroups(snapshots: GroupSnapshot[]): Promise<void> {
    const newId = new Map<number, number>();
    for (const {group} of snapshots) {
      const created = await groupApi.createGroup({name: group.name, description: group.description});
      newId.set(group.id, created.id);
    }
    const remap = (ids: number[]) => ids.map(id => newId.get(id) ?? id);
    for (const s of snapshots) {
      for (const itemId of s.memberIds) await setMembership(itemId, newId.get(s.group.id)!, true);
      for (const payload of s.items) await restoreItem({...payload, groupIds: remap(payload.groupIds)});
    }
    bump();
  },
  createGroup: (name: string, description?: string) =>
    groupApi.createGroup({name: name.trim(), description: description?.trim() || null}),
  updateGroup: (id: number, name: string, description: string) =>
    groupApi.updateGroup(id, {name: name.trim(), description: description.trim() || null}),

  async loadPage(groupId: number) {
    const [group, items, allItems] = await Promise.all([
      groupApi.getGroup(groupId),
      groupApi.getGroupItems(groupId),
      itemApi.getItems(),
    ]);
    return {group, items, allItems};
  },

  addItem: (itemId: number, groupId: number) => setMembership(itemId, groupId, true),
  removeItem: (itemId: number, groupId: number) => setMembership(itemId, groupId, false),
};
