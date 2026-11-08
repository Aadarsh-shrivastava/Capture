import Storage from 'expo-sqlite/kv-store';
import {create} from 'zustand';

/** What can be shown or hidden on screen. All on by default; each choice survives restarts. */
type Appearance = {
  /** Experimental: off = no bottom tab bar, just a small "+ Add" (Focus is home; Library is in the side menu). */
  tabBar: boolean;
  /** The "0 of 3 done" bar at the top of Focus. */
  progressBar: boolean;
};

const KEYS: Record<keyof Appearance, string> = {tabBar: 'layout.tabBar', progressBar: 'layout.progressBar'};

export const useAppearance = create<Appearance & {set: (key: keyof Appearance, on: boolean) => void}>(set => ({
  tabBar: Storage.getItemSync(KEYS.tabBar) !== 'off',
  progressBar: Storage.getItemSync(KEYS.progressBar) !== 'off',
  set: (key, on) => {
    Storage.setItemSync(KEYS[key], on ? 'on' : 'off');
    set({[key]: on} as Pick<Appearance, typeof key>);
  },
}));
