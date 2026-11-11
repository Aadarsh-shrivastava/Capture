import Storage from 'expo-sqlite/kv-store';
import {create} from 'zustand';

const KEY = 'taskActions.postponeHours';
export const POSTPONE_OPTIONS = [1, 3, 6, 12, 24];

/** How far "Later" pushes a task. Default 6 hours; survives restarts. */
export const usePostponeSettings = create<{hours: number; setHours: (h: number) => void}>(set => ({
  hours: Number(Storage.getItemSync(KEY)) || 6,
  setHours: hours => {
    Storage.setItemSync(KEY, String(hours));
    set({hours});
  },
}));
