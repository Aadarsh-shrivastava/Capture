import {create} from 'zustand';

/** Bumped after every item save so lists (Focus, etc.) reload without a manual refresh. */
export const useDataVersionStore = create<{version: number; bump: () => void}>(set => ({
  version: 0,
  bump: () => set(state => ({version: state.version + 1})),
}));
