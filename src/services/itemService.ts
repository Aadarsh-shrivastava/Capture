import { AppError } from '@/lib/errors';
import type { SaveItemPayload, ItemFull } from '@/models/behaviorData';
import type { ItemWithType } from '@/models/item';
import { itemSaveRepository } from '@/repositories/itemSaveRepository';
import {
  behaviorRepository,
  itemRepository,
  itemTypeRepository,
} from '@/repositories/itemRepository';

export const itemService = {
  async saveItem(payload: SaveItemPayload, itemId?: number): Promise<ItemWithType> {
    if (!payload.title.trim()) {
      throw new AppError('Title is required', 'VALIDATION_ERROR');
    }

    const itemType = await itemTypeRepository.findById(payload.typeId);
    if (!itemType) {
      throw new AppError('Item type not found', 'NOT_FOUND');
    }

    let savedId = itemId;
    if (savedId) {
      await itemSaveRepository.updateComplete(savedId, payload);
    } else {
      savedId = await itemSaveRepository.createComplete(payload);
    }

    const item = await itemRepository.findByIdWithType(savedId);
    if (!item) {
      throw new AppError('Failed to load saved item', 'UNKNOWN_ERROR');
    }
    return item;
  },

  async getItemFull(itemId: number): Promise<ItemFull> {
    const full = await itemSaveRepository.loadFull(itemId);
    if (!full) {
      throw new AppError('Item not found', 'NOT_FOUND');
    }
    return full;
  },

  async getItems(): Promise<ItemWithType[]> {
    return itemRepository.findAll();
  },

  async getItemsForToday(): Promise<ItemWithType[]> {
    const today = new Date().toISOString().slice(0, 10);
    return itemRepository.findCreatedOnDate(today);
  },

  async getItemById(id: number): Promise<ItemWithType> {
    const item = await itemRepository.findByIdWithType(id);
    if (!item) {
      throw new AppError('Item not found', 'NOT_FOUND');
    }
    return item;
  },

  async deleteItem(id: number): Promise<void> {
    const existing = await itemRepository.findById(id);
    if (!existing) {
      throw new AppError('Item not found', 'NOT_FOUND');
    }
    await itemRepository.delete(id);
  },

  async getEffectiveBehaviors(itemId: number) {
    const item = await itemRepository.findById(itemId);
    if (!item) throw new AppError('Item not found', 'NOT_FOUND');
    return itemRepository.getEffectiveBehaviors(itemId);
  },

  async getTypeDefaultBehaviors(typeId: number) {
    const itemType = await itemTypeRepository.findById(typeId);
    if (!itemType) throw new AppError('Item type not found', 'NOT_FOUND');
    return itemTypeRepository.getDefaultBehaviors(typeId);
  },

  async getOptionalBehaviors(itemId: number) {
    return itemRepository.getItemExplicitBehaviors(itemId);
  },

  async getAllBehaviors() {
    return behaviorRepository.findAll();
  },
};

export const itemTypeService = {
  async getItemTypes() {
    return itemTypeRepository.findAll();
  },
};

export const behaviorService = {
  async getBehaviors() {
    return behaviorRepository.findAll();
  },
};
