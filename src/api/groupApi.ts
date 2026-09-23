import { toAppError } from '@/lib/errors';
import type { CreateGroupInput, UpdateGroupInput } from '@/models/group';
import { groupService } from '@/services/groupService';

export const groupApi = {
  async createGroup(input: CreateGroupInput) {
    try {
      return await groupService.createGroup(input);
    } catch (error) {
      throw toAppError(error, 'Unable to create group');
    }
  },

  async getGroups() {
    try {
      return await groupService.getGroups();
    } catch (error) {
      throw toAppError(error, 'Unable to load groups');
    }
  },

  async getGroup(id: number) {
    try {
      return await groupService.getGroup(id);
    } catch (error) {
      throw toAppError(error, 'Unable to load group');
    }
  },

  async updateGroup(id: number, input: UpdateGroupInput) {
    try {
      return await groupService.updateGroup(id, input);
    } catch (error) {
      throw toAppError(error, 'Unable to update group');
    }
  },

  async deleteGroup(id: number) {
    try {
      await groupService.deleteGroup(id);
    } catch (error) {
      throw toAppError(error, 'Unable to delete group');
    }
  },

  async getGroupItems(groupId: number) {
    try {
      return await groupService.getGroupItems(groupId);
    } catch (error) {
      throw toAppError(error, 'Unable to load group items');
    }
  },

  async getItemGroups(itemId: number) {
    try {
      return await groupService.getItemGroups(itemId);
    } catch (error) {
      throw toAppError(error, 'Unable to load item groups');
    }
  },

  async setItemGroups(itemId: number, groupIds: number[]) {
    try {
      await groupService.setItemGroups(itemId, groupIds);
    } catch (error) {
      throw toAppError(error, 'Unable to update item groups');
    }
  },
};
