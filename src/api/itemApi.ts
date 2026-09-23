import { toAppError } from '@/lib/errors';
import type { SaveItemPayload } from '@/models/behaviorData';
import type { UpdateItemInput } from '@/models/item';
import { itemService, behaviorService, itemTypeService } from '@/services/itemService';

export const itemApi = {
  async saveItem(payload: SaveItemPayload, itemId?: number) {
    try {
      return await itemService.saveItem(payload, itemId);
    } catch (error) {
      throw toAppError(error, 'Unable to save item');
    }
  },

  async getItemFull(id: number) {
    try {
      return await itemService.getItemFull(id);
    } catch (error) {
      throw toAppError(error, 'Unable to load item');
    }
  },

  async getItems() {
    try {
      return await itemService.getItems();
    } catch (error) {
      throw toAppError(error, 'Unable to load items');
    }
  },

  async getItemsForToday() {
    try {
      return await itemService.getItemsForToday();
    } catch (error) {
      throw toAppError(error, "Unable to load today's items");
    }
  },

  async getItem(id: number) {
    try {
      return await itemService.getItemById(id);
    } catch (error) {
      throw toAppError(error, 'Unable to load item');
    }
  },

  async deleteItem(id: number) {
    try {
      await itemService.deleteItem(id);
    } catch (error) {
      throw toAppError(error, 'Unable to delete item');
    }
  },

  async getEffectiveBehaviors(itemId: number) {
    try {
      return await itemService.getEffectiveBehaviors(itemId);
    } catch (error) {
      throw toAppError(error, 'Unable to load item behaviors');
    }
  },

  async getTypeDefaultBehaviors(typeId: number) {
    try {
      return await itemService.getTypeDefaultBehaviors(typeId);
    } catch (error) {
      throw toAppError(error, 'Unable to load type behaviors');
    }
  },

  async getOptionalBehaviors(itemId: number) {
    try {
      return await itemService.getOptionalBehaviors(itemId);
    } catch (error) {
      throw toAppError(error, 'Unable to load optional behaviors');
    }
  },

  /** @deprecated use saveItem */
  async createItem(payload: SaveItemPayload) {
    return this.saveItem(payload);
  },

  /** @deprecated use saveItem */
  async updateItem(id: number, _input: UpdateItemInput) {
    throw toAppError(new Error('Use saveItem with full payload'), 'Use saveItem instead');
  },
};

export const typeApi = {
  async getItemTypes() {
    try {
      return await itemTypeService.getItemTypes();
    } catch (error) {
      throw toAppError(error, 'Unable to load item types');
    }
  },
};

export const behaviorApi = {
  async getBehaviors() {
    try {
      return await behaviorService.getBehaviors();
    } catch (error) {
      throw toAppError(error, 'Unable to load behaviors');
    }
  },
};
