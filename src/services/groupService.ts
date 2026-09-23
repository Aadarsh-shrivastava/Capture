import { AppError } from '@/lib/errors';
import type { CreateGroupInput, Group, GroupWithCount, UpdateGroupInput } from '@/models/group';
import type { ItemWithType } from '@/models/item';
import { groupRepository } from '@/repositories/groupRepository';
import { itemRepository } from '@/repositories/itemRepository';

export const groupService = {
  async createGroup(input: CreateGroupInput): Promise<Group> {
    if (!input.name.trim()) {
      throw new AppError('Group name is required', 'VALIDATION_ERROR');
    }

    return groupRepository.create(input);
  },

  async getGroups(): Promise<GroupWithCount[]> {
    return groupRepository.findAllWithCounts();
  },

  async getGroup(id: number): Promise<GroupWithCount> {
    const group = await groupRepository.findById(id);
    if (!group) {
      throw new AppError('Group not found', 'NOT_FOUND');
    }

    const groups = await groupRepository.findAllWithCounts();
    const withCount = groups.find((entry) => entry.id === id);

    if (!withCount) {
      throw new AppError('Group not found', 'NOT_FOUND');
    }

    return withCount;
  },

  async updateGroup(id: number, input: UpdateGroupInput): Promise<Group> {
    const existing = await groupRepository.findById(id);
    if (!existing) {
      throw new AppError('Group not found', 'NOT_FOUND');
    }

    if (input.name !== undefined && !input.name.trim()) {
      throw new AppError('Group name is required', 'VALIDATION_ERROR');
    }

    return groupRepository.update(id, input);
  },

  async deleteGroup(id: number): Promise<void> {
    const existing = await groupRepository.findById(id);
    if (!existing) {
      throw new AppError('Group not found', 'NOT_FOUND');
    }

    await groupRepository.delete(id);
  },

  async getGroupItems(groupId: number): Promise<ItemWithType[]> {
    const group = await groupRepository.findById(groupId);
    if (!group) {
      throw new AppError('Group not found', 'NOT_FOUND');
    }

    return groupRepository.getItemsForGroup(groupId);
  },

  async getItemGroups(itemId: number) {
    const item = await itemRepository.findById(itemId);
    if (!item) {
      throw new AppError('Item not found', 'NOT_FOUND');
    }

    return groupRepository.getGroupsForItem(itemId);
  },

  async setItemGroups(itemId: number, groupIds: number[]): Promise<void> {
    const item = await itemRepository.findById(itemId);
    if (!item) {
      throw new AppError('Item not found', 'NOT_FOUND');
    }

    await groupRepository.setItemGroups(itemId, groupIds);
  },
};
