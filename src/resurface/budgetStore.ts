import Storage from 'expo-sqlite/kv-store';
import {create} from 'zustand';

import {hide, markSeen, type Budget} from './budget';

const KEY = 'resurface.budget';

function load(): Budget {
  try {
    return {hiddenUntil: 0, day: '', seen: [], ...JSON.parse(Storage.getItemSync(KEY) ?? '{}')};
  } catch {
    return {hiddenUntil: 0, day: '', seen: []};
  }
}

/** Come-back budget, remembered across launches (a hide lasts even if the app restarts). */
export const useBudgetStore = create<{budget: Budget; seen: (id: number) => void; hide: () => void}>((set, get) => {
  const save = (budget: Budget) => {
    Storage.setItemSync(KEY, JSON.stringify(budget));
    set({budget});
  };
  return {
    budget: load(),
    seen: id => {
      const next = markSeen(get().budget, id);
      if (next !== get().budget) save(next);
    },
    hide: () => save(hide(get().budget)),
  };
});
