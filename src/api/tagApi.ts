import { toAppError } from '@/lib/errors';
import { tagRepository } from '@/repositories/tagRepository';

export const tagApi = {
  async getTags() {
    try {
      return await tagRepository.findAll();
    } catch (error) {
      throw toAppError(error, 'Unable to load tags');
    }
  },

  async createTag(name: string) {
    try {
      return await tagRepository.findOrCreate(name);
    } catch (error) {
      throw toAppError(error, 'Unable to create tag');
    }
  },
};
