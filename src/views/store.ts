import Storage from 'expo-sqlite/kv-store';
import {create} from 'zustand';

import type {ViewKey} from './registry';

const VIEW_KEY = 'views.current';

/** Last Focus mode, remembered across launches. */
export const useViewStore = create<{view: ViewKey; setView: (v: ViewKey) => void}>(set => ({
  view: (Storage.getItemSync(VIEW_KEY) as ViewKey | null) ?? 'today',
  setView: view => {
    Storage.setItemSync(VIEW_KEY, view);
    set({view});
  },
}));
