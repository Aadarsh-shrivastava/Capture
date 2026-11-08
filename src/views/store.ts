import Storage from 'expo-sqlite/kv-store';
import {create} from 'zustand';

import type {ViewKey} from './registry';

const VIEW_KEY = 'views.current';

type ViewState = {
  view: ViewKey;
  /** YYYY-MM-DD shown by the Custom date view. */
  day: string | null;
  setView: (v: ViewKey) => void;
  setDay: (day: string) => void;
};

/** Last Focus mode, remembered across launches (a custom date is not — it would go stale). */
export const useViewStore = create<ViewState>(set => ({
  view: (Storage.getItemSync(VIEW_KEY) as ViewKey | null) ?? 'today',
  day: null,
  setView: view => {
    Storage.setItemSync(VIEW_KEY, view);
    set({view});
  },
  setDay: day => set({view: 'custom', day}),
}));
