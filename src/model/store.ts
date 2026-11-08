import {create} from 'zustand';

import {deleteModel, downloadModel, isModelDownloaded} from './modelFile';

type ModelState = {
  status: 'unknown' | 'missing' | 'downloading' | 'ready';
  pct: number;
  error: string | null;
  check: () => Promise<void>;
  download: () => Promise<boolean>;
  remove: () => Promise<void>;
};

/** Is the model file on this device? Shared by Settings and capture so both show the same progress. */
export const useModelStore = create<ModelState>((set, get) => ({
  status: 'unknown',
  pct: 0,
  error: null,
  check: async () => {
    if (get().status === 'downloading') return;
    set({status: (await isModelDownloaded()) ? 'ready' : 'missing'});
  },
  download: async () => {
    if (get().status === 'downloading') return false;
    set({status: 'downloading', pct: 0, error: null});
    try {
      await downloadModel(pct => set({pct}));
      set({status: 'ready'});
      return true;
    } catch (e) {
      set({status: 'missing', error: e instanceof Error ? e.message : String(e)});
      return false;
    }
  },
  remove: async () => {
    await deleteModel();
    set({status: 'missing'});
  },
}));
