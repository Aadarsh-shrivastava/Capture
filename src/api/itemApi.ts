import { toAppError } from '@/lib/errors';
import type { SaveItemPayload } from '@/models/behaviorData';
import { itemService, behaviorService, itemTypeService } from '@/services/itemService';
import { useDataVersionStore } from '@/store/dataVersionStore';

export const itemApi = {
  async saveItem(payload: SaveItemPayload, itemId?: number) {
    try {
      const saved = await itemService.saveItem(payload, itemId);
      useDataVersionStore.getState().bump();
      return saved;
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
      useDataVersionStore.getState().bump();
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
