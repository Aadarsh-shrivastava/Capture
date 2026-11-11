import {create} from 'zustand';

export const useWeeklyReviewStore = create<{visible: boolean; open: () => void; close: () => void}>(set => ({
  visible: false,
  open: () => set({visible: true}),
  close: () => set({visible: false}),
}));
