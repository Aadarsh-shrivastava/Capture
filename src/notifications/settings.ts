import Storage from 'expo-sqlite/kv-store';
import {create} from 'zustand';

const KEY = 'taskReminders.enabled';

/** On by default; the choice survives restarts. */
export const useReminderSettings = create<{enabled: boolean; setEnabled: (v: boolean) => void}>(set => ({
  enabled: Storage.getItemSync(KEY) !== 'off',
  setEnabled: enabled => {
    Storage.setItemSync(KEY, enabled ? 'on' : 'off');
    set({enabled});
  },
}));
