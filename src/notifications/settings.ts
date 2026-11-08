import Storage from 'expo-sqlite/kv-store';
import {create} from 'zustand';

const KEY = 'taskReminders.enabled';
const CAPTURE_KEY = 'captureNotification.enabled';

/** On by default; the choice survives restarts. */
export const useReminderSettings = create<{enabled: boolean; setEnabled: (v: boolean) => void}>(set => ({
  enabled: Storage.getItemSync(KEY) !== 'off',
  setEnabled: enabled => {
    Storage.setItemSync(KEY, enabled ? 'on' : 'off');
    set({enabled});
  },
}));

/** Pinned capture notification (Android). Off by default; the native side re-posts it on each launch. */
export const useCaptureNotificationSetting = create<{enabled: boolean; setEnabled: (v: boolean) => void}>(set => ({
  enabled: Storage.getItemSync(CAPTURE_KEY) === 'on',
  setEnabled: enabled => {
    Storage.setItemSync(CAPTURE_KEY, enabled ? 'on' : 'off');
    set({enabled});
  },
}));
